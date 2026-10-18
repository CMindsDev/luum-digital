/**
 * Proveedor OpenAI Realtime por WebRTC (portado de AlexLive, Vital Oceans src/experience/alex-live.ts).
 *
 * - Un solo RTCPeerConnection para texto y voz. Se negocia una pista de audio SILENCIOSA desde el
 *   inicio (no pide micrófono); la voz la reemplaza con replaceTrack sólo tras un gesto explícito.
 * - Canal de datos "oai-events". La sesión la crea el servidor (POST /api/asistente/conexiones):
 *   la clave nunca llega al navegador.
 * - Las llamadas de función se emiten como eventos "accion"; la app las ejecuta y responde con
 *   entregarRecibo → function_call_output, y un único response.create por turno cuando todas
 *   las llamadas de ese turno ya tienen recibo.
 * - «[Pantalla actual]» es un único ítem de sistema que se reemplaza (con debounce).
 * - Nunca registra contenido de mensajes ni pantallas.
 */
import { accionesDelAmbito, esNombreAccion, type AmbitoAsistente, type ReciboAccion } from "@shared/asistente/acciones";
import { describirPantalla, type PantallaActual } from "@shared/asistente/pantalla";
import { ErrorServidorSchema, RespuestaConexionSchema, RUTAS_API_ASISTENTE, CODIGOS_ERROR } from "@shared/asistente/servidor";
import type {
  AssistantProvider,
  EstadoSesionAsistente,
  EventoAsistente,
  FuenteCitada,
  OpcionesSesion,
  SesionAsistente,
} from "@/services/contracts";
import { fuentesDeRecibo } from "../../runtime/ejecutor";
import { pantallaMinima } from "../../runtime/pantalla";
import { i18n } from "@/i18n";
import { aviso, avisoPorCodigo, ErrorAsistente } from "../avisos";
import { ENFOQUES_EXPERTOS, type ExpertoAsistente } from "@shared/asistente/expertos";
import { enrutarExperto } from "@/domain/expertos-asistente";

/** Turnos de voz por detección semántica; hablar encima interrumpe al asistente. */
export const DETECCION_TURNOS_VOZ = {
  type: "semantic_vad",
  eagerness: "high",
  create_response: false,
  interrupt_response: true,
} as const;

const TIEMPO_CANAL_MS = 15_000;
const PANTALLA_DEBOUNCE_MS = 400;
const PANTALLA_MAX_MS = 1_200;
const NIVEL_INTERVALO_MS = 80;

export interface OpcionesSesionRealtime extends OpcionesSesion {
  /** Obligatorio (true) en el ámbito bienestar: el servidor lo exige además de BIENESTAR_IA_REAL. */
  consentimientoBienestar?: boolean;
}

/** Salida de audio mínima (un <audio>; un doble en pruebas). */
export type SalidaAudio = Pick<HTMLAudioElement, "play" | "pause" | "muted" | "srcObject" | "autoplay">;

export interface DependenciasRealtime {
  fetch?: typeof fetch;
  crearConexion?: () => RTCPeerConnection;
  crearAudio?: () => SalidaAudio;
  crearContextoAudio?: () => AudioContext | null;
  obtenerMicrofono?: (restricciones: MediaStreamConstraints) => Promise<MediaStream>;
  tiempoCanalMs?: number;
  pantallaDebounceMs?: number;
}

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function texto(valor: unknown): string | null {
  return typeof valor === "string" ? valor : null;
}

function hexAleatorio(longitud: number): string {
  const bytes = new Uint8Array(Math.ceil(longitud / 2));
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, longitud);
}

function contextoAudioPredeterminado(): AudioContext | null {
  return typeof AudioContext === "function" ? new AudioContext() : null;
}

function audioPredeterminado(): SalidaAudio {
  const audio = new Audio();
  audio.autoplay = true;
  audio.muted = true;
  return audio;
}

async function microfonoPredeterminado(restricciones: MediaStreamConstraints): Promise<MediaStream> {
  if (typeof window === "undefined" || !window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    throw new ErrorAsistente(aviso("microfono_no_disponible"));
  }
  return navigator.mediaDevices.getUserMedia(restricciones);
}

/** Traduce el rechazo de getUserMedia a un aviso legible. */
export function errorDeMicrofono(error: unknown): ErrorAsistente {
  if (error instanceof ErrorAsistente) return error;
  const nombre = error instanceof Error || (typeof DOMException !== "undefined" && error instanceof DOMException) ? error.name : "";
  if (nombre === "NotAllowedError" || nombre === "SecurityError") return new ErrorAsistente(aviso("microfono_bloqueado"));
  return new ErrorAsistente(aviso("microfono_no_disponible"));
}

function textoDeContenido(contenido: unknown): string {
  if (!Array.isArray(contenido)) return "";
  return contenido
    .map((parte) => (esRegistro(parte) ? (texto(parte.text) ?? texto(parte.transcript) ?? "") : ""))
    .filter(Boolean)
    .join("\n");
}

/** RMS de muestras de 8 bits (silencio = 128), normalizado a 0..1. */
function nivelDeMuestras(muestras: Uint8Array): number {
  if (muestras.length === 0) return 0;
  let suma = 0;
  for (const muestra of muestras) {
    const valor = (muestra - 128) / 128;
    suma += valor * valor;
  }
  const rms = Math.sqrt(suma / muestras.length);
  return Math.min(1, Math.max(0, (rms - 0.015) / 0.22));
}

export class SesionRealtime implements SesionAsistente {
  readonly ambito: AmbitoAsistente;
  private readonly solicitar: typeof fetch;
  private readonly crearConexion: () => RTCPeerConnection;
  private readonly crearContextoAudio: () => AudioContext | null;
  private readonly obtenerMicrofonoDep: (restricciones: MediaStreamConstraints) => Promise<MediaStream>;
  private readonly tiempoCanalMs: number;
  private readonly pantallaDebounceMs: number;
  private readonly audio: SalidaAudio;
  private readonly oyentes = new Set<(evento: EventoAsistente) => void>();
  private readonly controlador = new AbortController();

  private peer: RTCPeerConnection | null = null;
  private canal: RTCDataChannel | null = null;
  private emisor: RTCRtpSender | null = null;
  private pistaSilenciosa: MediaStreamTrack | null = null;
  private contextoSilencio: AudioContext | null = null;
  private microfono: MediaStream | null = null;
  private flujoRemoto: MediaStream | null = null;
  private conexionId: string | null = null;
  private temporizadorFin: ReturnType<typeof setTimeout> | null = null;
  private cerrada = false;
  private lista = false;
  private voz = false;
  private estado: EstadoSesionAsistente = "inactivo";

  // Turnos y herramientas.
  private respuestaActiva = false;
  private necesitaRespuesta = false;
  private reintentarRespuesta = false;
  private readonly llamadasVistas = new Set<string>();
  private readonly llamadasPendientes = new Set<string>();
  private readonly colaTextos: string[] = [];
  private readonly textoParcial = new Map<string, string>();
  private readonly publicados = new Set<string>();
  private fuentesPendientes: FuenteCitada[] = [];
  private experto: ExpertoAsistente = "general";
  private itemExpertoId: string | null = null;
  private readonly transcripcionesVistas = new Set<string>();

  // «[Pantalla actual]».
  private pantalla: PantallaActual | null = null;
  private itemPantallaId: string | null = null;
  private textoPantalla = "";
  private temporizadorPantalla: ReturnType<typeof setTimeout> | null = null;
  private pantallaSuciaDesde = 0;

  // Nivel de voz.
  private contextoNivel: AudioContext | null = null;
  private analizadorMicrofono: AnalyserNode | null = null;
  private analizadorRemoto: AnalyserNode | null = null;
  private temporizadorNivel: ReturnType<typeof setInterval> | null = null;
  private nivelEmitido = 0;

  constructor(ambito: AmbitoAsistente, dependencias: DependenciasRealtime = {}) {
    this.ambito = ambito;
    this.solicitar = dependencias.fetch ?? ((entrada, init) => globalThis.fetch(entrada, init));
    this.crearConexion = dependencias.crearConexion ?? (() => new RTCPeerConnection());
    this.crearContextoAudio = dependencias.crearContextoAudio ?? contextoAudioPredeterminado;
    this.obtenerMicrofonoDep = dependencias.obtenerMicrofono ?? microfonoPredeterminado;
    this.tiempoCanalMs = dependencias.tiempoCanalMs ?? TIEMPO_CANAL_MS;
    this.pantallaDebounceMs = dependencias.pantallaDebounceMs ?? PANTALLA_DEBOUNCE_MS;
    this.audio = (dependencias.crearAudio ?? audioPredeterminado)();
  }

  // --- API pública (SesionAsistente) ---

  suscribir(oyente: (evento: EventoAsistente) => void): () => void {
    this.oyentes.add(oyente);
    return () => {
      this.oyentes.delete(oyente);
    };
  }

  enviarTexto(contenido: string): void {
    const limpio = contenido.trim();
    if (!limpio) return;
    if (this.cerrada || this.canal?.readyState !== "open") {
      this.emitir({ tipo: "aviso", aviso: aviso("red_cortada") });
      return;
    }
    // Mientras el asistente responde o espera recibos, el texto espera su turno.
    if (this.ocupada()) {
      this.colaTextos.push(limpio);
      return;
    }
    this.enviarTurno(limpio);
  }

  actualizarPantalla(pantalla: PantallaActual): void {
    if (this.cerrada) return;
    this.pantalla = pantalla;
    const ahora = Date.now();
    this.pantallaSuciaDesde ||= ahora;
    if (this.temporizadorPantalla) clearTimeout(this.temporizadorPantalla);
    const espera = ahora - this.pantallaSuciaDesde >= PANTALLA_MAX_MS ? 0 : this.pantallaDebounceMs;
    this.temporizadorPantalla = setTimeout(() => this.publicarPantalla(), espera);
  }

  entregarRecibo(recibo: ReciboAccion): void {
    if (this.cerrada || !this.llamadasPendientes.has(recibo.llamadaId)) return;
    this.llamadasPendientes.delete(recibo.llamadaId);
    for (const fuente of fuentesDeRecibo(recibo)) {
      if (!this.fuentesPendientes.some((previa) => previa.titulo === fuente.titulo && previa.url === fuente.url)) {
        this.fuentesPendientes.push(fuente);
      }
    }
    this.enviarSalidaHerramienta(recibo.llamadaId, { estado: recibo.estado, mensaje: recibo.mensaje, datos: recibo.datos ?? null });
  }

  /**
   * Activa la voz. Llamar dentro del gesto de la persona. Si ya está activa, sólo reintenta la
   * reproducción del audio (acción «Activar audio»). Se puede pasar un micrófono ya obtenido.
   */
  async iniciarVoz(microfonoObtenido?: MediaStream): Promise<void> {
    if (this.cerrada) return;
    if (this.voz) {
      await this.reproducir();
      return;
    }
    let flujo: MediaStream;
    try {
      flujo = microfonoObtenido ?? (await this.obtenerMicrofonoDep({ audio: { echoCancellation: true, noiseSuppression: true } }));
    } catch (error) {
      const fallo = errorDeMicrofono(error);
      this.emitir({ tipo: "aviso", aviso: fallo.aviso });
      throw fallo;
    }
    const pista = flujo.getAudioTracks()[0];
    if (this.cerrada || !pista) {
      for (const pistaFlujo of flujo.getTracks()) pistaFlujo.stop();
      if (!pista) {
        const fallo = new ErrorAsistente(aviso("microfono_no_disponible"));
        this.emitir({ tipo: "aviso", aviso: fallo.aviso });
        throw fallo;
      }
      return;
    }
    this.microfono = flujo;
    await this.emisor?.replaceTrack(pista);
    this.enviar("voz", {
      type: "session.update",
      session: { type: "realtime", output_modalities: ["audio"], audio: { input: { turn_detection: { ...DETECCION_TURNOS_VOZ, create_response: this.ambito !== "general" } } } },
    });
    this.voz = true;
    this.audio.muted = false;
    this.iniciarMedidor();
    this.cambiarEstado("escuchando");
    // No se espera: play() puede tardar hasta que llegue la pista remota y la llamada ya está activa.
    // Si el navegador bloquea el audio, reproducir() emite el aviso «Activar audio».
    void this.reproducir();
  }

  /** Silencia o reactiva el micrófono sin colgar: la pista sigue negociada, pero no envía audio. */
  silenciarMicrofono(silenciado: boolean): void {
    for (const pista of this.microfono?.getAudioTracks() ?? []) pista.enabled = !silenciado;
  }

  detenerVoz(): void {
    if (!this.voz) return;
    this.voz = false;
    this.detenerMedidor();
    for (const pista of this.microfono?.getTracks() ?? []) pista.stop();
    this.microfono = null;
    void this.emisor?.replaceTrack(this.pistaSilenciosa).catch(() => undefined);
    this.audio.pause();
    this.audio.muted = true;
    if (this.canal?.readyState === "open") {
      this.enviar("voz_cancelar", { type: "response.cancel" });
      this.enviar("voz_limpiar", { type: "output_audio_buffer.clear" });
      this.enviar("voz_limpiar", { type: "input_audio_buffer.clear" });
      this.enviar("voz", {
        type: "session.update",
        session: { type: "realtime", output_modalities: ["text"], audio: { input: { turn_detection: null } } },
      });
    }
    this.emitir({ tipo: "nivel_voz", nivel: 0 });
    this.cambiarEstado("listo");
  }

  cerrar(): void {
    if (this.cerrada) return;
    this.cerrada = true;
    this.lista = false;
    this.controlador.abort();
    if (this.temporizadorFin) clearTimeout(this.temporizadorFin);
    if (this.temporizadorPantalla) clearTimeout(this.temporizadorPantalla);
    this.temporizadorFin = null;
    this.temporizadorPantalla = null;
    this.detenerMedidor();
    for (const pista of this.microfono?.getTracks() ?? []) pista.stop();
    this.microfono = null;
    this.pistaSilenciosa?.stop();
    this.pistaSilenciosa = null;
    if (this.contextoSilencio) void this.contextoSilencio.close().catch(() => undefined);
    this.contextoSilencio = null;
    this.audio.pause();
    this.audio.srcObject = null;
    this.canal?.close();
    this.peer?.close();
    this.colaTextos.length = 0;
    this.llamadasPendientes.clear();
    this.desconectarServidor();
    this.emitir({ tipo: "estado", estado: "cerrado" });
    this.oyentes.clear();
  }

  // --- Conexión ---

  async conectar(opciones: OpcionesSesionRealtime): Promise<void> {
    this.experto = opciones.experto ?? "general";
    this.pantalla = opciones.pantalla;
    this.cambiarEstado("conectando");
    try {
      const peer = this.crearConexion();
      this.peer = peer;
      this.prepararPistaSilenciosa(peer);
      peer.ontrack = (evento) => {
        const flujo = evento.streams[0] ?? (typeof MediaStream === "function" ? new MediaStream([evento.track]) : null);
        if (!flujo) return;
        this.flujoRemoto = flujo;
        this.audio.srcObject = flujo;
        if (this.voz) this.conectarAnalizadorRemoto();
      };
      peer.onconnectionstatechange = () => {
        if (!this.cerrada && (peer.connectionState === "failed" || peer.connectionState === "disconnected")) {
          this.emitir({ tipo: "aviso", aviso: aviso("red_cortada") });
          this.cerrar();
        }
      };
      const canal = peer.createDataChannel("oai-events");
      this.canal = canal;
      canal.onmessage = (evento: MessageEvent) => this.recibir(evento.data);
      canal.onclose = () => {
        if (this.cerrada) return;
        this.emitir({ tipo: "aviso", aviso: aviso("red_cortada") });
        this.cerrar();
      };

      const oferta = await peer.createOffer();
      await peer.setLocalDescription(oferta);
      if (!oferta.sdp || this.cerrada) throw new ErrorAsistente(aviso("conexion_fallida"));

      const respuesta = await this.crearLlamada(opciones, oferta.sdp);
      this.conexionId = respuesta.id;
      if (this.cerrada) throw new ErrorAsistente(aviso("conexion_fallida"));
      await peer.setRemoteDescription({ type: "answer", sdp: respuesta.sdp });
      await this.esperarCanal(canal);

      this.temporizadorFin = setTimeout(() => {
        this.emitir({ tipo: "aviso", aviso: aviso("tiempo_maximo") });
        this.cerrar();
      }, respuesta.maxSegundos * 1000);
      // La pantalla inicial ya va en las instrucciones: sólo se publica cuando cambie.
      this.textoPantalla = describirPantalla(this.pantalla);
      this.lista = true;
      this.cambiarEstado("listo");
    } catch (error) {
      this.cerrar();
      throw error instanceof ErrorAsistente ? error : new ErrorAsistente(aviso("conexion_fallida"));
    }
  }

  private prepararPistaSilenciosa(peer: RTCPeerConnection) {
    // Se negocia una pista de audio desde el inicio: agregarla después exige renegociar.
    // Esta pista local y silenciosa no pide permiso de micrófono.
    let contexto: AudioContext | null;
    try {
      contexto = this.crearContextoAudio();
    } catch {
      contexto = null;
    }
    if (contexto) {
      this.contextoSilencio = contexto;
      const destino = contexto.createMediaStreamDestination();
      const oscilador = contexto.createOscillator();
      const ganancia = contexto.createGain();
      ganancia.gain.value = 0;
      oscilador.connect(ganancia).connect(destino);
      oscilador.start();
      const pista = destino.stream.getAudioTracks()[0];
      if (pista) {
        this.pistaSilenciosa = pista;
        this.emisor = peer.addTrack(pista, destino.stream);
        return;
      }
    }
    this.emisor = peer.addTransceiver("audio", { direction: "sendrecv" }).sender;
  }

  private async crearLlamada(opciones: OpcionesSesionRealtime, sdp: string) {
    const enviarSolicitud = (pantalla: PantallaActual) =>
      this.solicitar(RUTAS_API_ASISTENTE.conexiones, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        signal: this.controlador.signal,
        body: JSON.stringify({
          ambito: opciones.ambito,
          sdp,
          pantalla,
          ...(opciones.consentimientoBienestar !== undefined ? { consentimientoBienestar: opciones.consentimientoBienestar } : {}),
          ...(opciones.nombreParaSaludo ? { nombreParaSaludo: opciones.nombreParaSaludo } : {}),
          idioma: i18n.language === "yua" ? "yua" : "es",
          ...(opciones.experto ? { experto: opciones.experto } : {}),
        }),
      });
    let respuesta: Response;
    try {
      respuesta = await enviarSolicitud(opciones.pantalla);
      // Una pantalla que el servidor rechaza no debe impedir la conversación.
      if (respuesta.status === 422) respuesta = await enviarSolicitud(pantallaMinima(opciones.pantalla.ruta, opciones.pantalla.rol));
    } catch {
      throw new ErrorAsistente(aviso("conexion_fallida"));
    }
    const cuerpo: unknown = await respuesta.json().catch(() => null);
    if (!respuesta.ok) {
      const error = ErrorServidorSchema.safeParse(cuerpo);
      const codigo = error.success ? error.data.codigo : undefined;
      throw new ErrorAsistente(avisoPorCodigo(codigo, error.success ? error.data.error : undefined), codigo ?? CODIGOS_ERROR.proveedor);
    }
    const datos = RespuestaConexionSchema.safeParse(cuerpo);
    if (!datos.success) throw new ErrorAsistente(aviso("conexion_fallida"));
    return datos.data;
  }

  private esperarCanal(canal: RTCDataChannel): Promise<void> {
    if (canal.readyState === "open") return Promise.resolve();
    return new Promise<void>((resolver, rechazar) => {
      const temporizador = setTimeout(() => rechazar(new ErrorAsistente(aviso("tiempo_agotado"))), this.tiempoCanalMs);
      canal.addEventListener(
        "open",
        () => {
          clearTimeout(temporizador);
          resolver();
        },
        { once: true },
      );
      this.controlador.signal.addEventListener(
        "abort",
        () => {
          clearTimeout(temporizador);
          rechazar(new ErrorAsistente(aviso("conexion_fallida")));
        },
        { once: true },
      );
    });
  }

  private desconectarServidor() {
    const id = this.conexionId;
    this.conexionId = null;
    if (!id) return;
    void this.solicitar(`${RUTAS_API_ASISTENTE.conexiones}/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "same-origin",
      keepalive: true,
    }).catch(() => undefined);
  }

  // --- Envío ---

  private enviar(prefijo: string, evento: Record<string, unknown>) {
    if (this.canal?.readyState !== "open") return;
    try {
      this.canal.send(JSON.stringify({ ...evento, event_id: `${prefijo}_${hexAleatorio(20)}` }));
    } catch {
      // El cierre del canal se informa por su propio evento.
    }
  }

  private ocupada(): boolean {
    return this.respuestaActiva || this.llamadasPendientes.size > 0 || this.necesitaRespuesta;
  }

  private enviarTurno(contenido: string) {
    this.publicarPantalla();
    this.enviar("pregunta", {
      type: "conversation.item.create",
      item: { type: "message", role: "user", content: [{ type: "input_text", text: contenido }] },
    });
    this.enrutarTurno(contenido);
    this.solicitarRespuesta();
    this.cambiarEstado("pensando");
  }

  private enrutarTurno(contenido: string) {
    if (this.ambito !== "general") return;
    const siguiente = enrutarExperto(contenido, this.experto);
    if (siguiente !== this.experto) {
      if (this.itemExpertoId) this.enviar("tema_borrar", { type: "conversation.item.delete", item_id: this.itemExpertoId });
      const id = `tema_${hexAleatorio(24)}`;
      this.enviar("tema", {
        type: "conversation.item.create",
        item: {
          id,
          type: "message",
          role: "system",
          content: [{ type: "input_text", text: `[Tema de orientación automático]\n${ENFOQUES_EXPERTOS[siguiente]}\nNo cambian tus fuentes, permisos ni reglas de seguridad. No transfieras mensajes al ámbito privado de bienestar.` }],
        },
      });
      this.itemExpertoId = id;
      this.experto = siguiente;
    }
    this.emitir({ tipo: "experto", experto: siguiente });
  }

  private solicitarRespuesta() {
    this.respuestaActiva = true;
    this.enviar("respuesta", { type: "response.create" });
  }

  private enviarSalidaHerramienta(llamadaId: string, salida: unknown) {
    this.enviar("herramienta", {
      type: "conversation.item.create",
      item: { type: "function_call_output", call_id: llamadaId, output: JSON.stringify(salida) },
    });
    this.necesitaRespuesta = true;
    this.continuar();
  }

  /** Un solo response.create por turno, cuando ya no hay respuesta activa ni recibos pendientes. */
  private continuar() {
    if (this.cerrada || this.respuestaActiva || this.llamadasPendientes.size > 0) return;
    if (this.necesitaRespuesta || this.reintentarRespuesta) {
      this.necesitaRespuesta = false;
      this.reintentarRespuesta = false;
      this.publicarPantalla();
      this.solicitarRespuesta();
      return;
    }
    const siguiente = this.colaTextos.shift();
    if (siguiente) this.enviarTurno(siguiente);
  }

  private publicarPantalla() {
    if (this.temporizadorPantalla) clearTimeout(this.temporizadorPantalla);
    this.temporizadorPantalla = null;
    this.pantallaSuciaDesde = 0;
    if (!this.lista || this.cerrada || !this.pantalla || this.canal?.readyState !== "open") return;
    const contenido = describirPantalla(this.pantalla);
    if (contenido === this.textoPantalla) return;
    if (this.itemPantallaId) {
      this.enviar("pantalla_borrar", { type: "conversation.item.delete", item_id: this.itemPantallaId });
    }
    const id = `scr_${hexAleatorio(24)}`;
    this.enviar("pantalla", {
      type: "conversation.item.create",
      item: { id, type: "message", role: "system", content: [{ type: "input_text", text: contenido }] },
    });
    this.itemPantallaId = id;
    this.textoPantalla = contenido;
  }

  // --- Recepción ---

  private recibir(crudo: unknown) {
    if (this.cerrada || typeof crudo !== "string") return;
    let evento: unknown;
    try {
      evento = JSON.parse(crudo);
    } catch {
      return;
    }
    if (esRegistro(evento)) this.manejarEvento(evento);
  }

  private manejarEvento(evento: Record<string, unknown>) {
    const tipo = texto(evento.type) ?? "";
    switch (tipo) {
      case "response.created":
        this.respuestaActiva = true;
        if (!this.voz) this.cambiarEstado("pensando");
        return;
      case "response.output_text.delta":
      case "response.output_audio_transcript.delta": {
        const itemId = texto(evento.item_id);
        const delta = texto(evento.delta);
        if (!itemId || delta === null) return;
        this.textoParcial.set(itemId, `${this.textoParcial.get(itemId) ?? ""}${delta}`);
        this.emitir({ tipo: "texto_delta", mensajeId: itemId, texto: delta });
        this.cambiarEstado(this.voz ? "hablando" : "pensando");
        return;
      }
      case "response.output_text.done":
      case "response.output_audio_transcript.done": {
        const itemId = texto(evento.item_id);
        const completo = texto(evento.text) ?? texto(evento.transcript);
        if (itemId && completo) this.textoParcial.set(itemId, completo);
        return;
      }
      case "conversation.item.input_audio_transcription.completed": {
        const itemId = texto(evento.item_id);
        const transcripcion = texto(evento.transcript);
        if (!itemId || this.transcripcionesVistas.has(itemId)) return;
        this.transcripcionesVistas.add(itemId);
        if (!transcripcion?.trim()) {
          if (this.voz && this.ambito === "general") {
            this.emitir({ tipo: "aviso", aviso: aviso("transcripcion_fallida") });
            this.cambiarEstado("escuchando");
          }
          return;
        }
        this.emitir({ tipo: "transcripcion_usuario", mensajeId: itemId, texto: transcripcion });
        if (this.voz && this.ambito === "general") {
          this.enrutarTurno(transcripcion);
          this.necesitaRespuesta = true;
          this.continuar();
        }
        return;
      }
      case "conversation.item.input_audio_transcription.failed":
        if (this.voz && this.ambito === "general") {
          this.emitir({ tipo: "aviso", aviso: aviso("transcripcion_fallida") });
          this.cambiarEstado("escuchando");
        }
        return;
      case "input_audio_buffer.speech_started":
        this.cambiarEstado("escuchando");
        return;
      case "input_audio_buffer.speech_stopped":
        this.cambiarEstado("pensando");
        return;
      case "response.function_call_arguments.done":
        this.manejarLlamada(texto(evento.call_id), texto(evento.name), evento.arguments);
        return;
      case "response.output_item.done": {
        const item = esRegistro(evento.item) ? evento.item : null;
        if (item?.type === "function_call") this.manejarLlamada(texto(item.call_id), texto(item.name), item.arguments);
        return;
      }
      case "response.done":
        this.terminarRespuesta(esRegistro(evento.response) ? evento.response : null);
        return;
      case "output_audio_buffer.started":
        if (this.voz) this.cambiarEstado("hablando");
        return;
      case "output_audio_buffer.stopped":
      case "output_audio_buffer.cleared":
        if (this.voz) this.cambiarEstado("escuchando");
        return;
      case "error":
        this.manejarError(esRegistro(evento.error) ? evento.error : null);
        return;
      default:
        return;
    }
  }

  private manejarLlamada(llamadaId: string | null, nombre: string | null, argumentosCrudos: unknown) {
    if (!llamadaId || this.llamadasVistas.has(llamadaId)) return;
    this.llamadasVistas.add(llamadaId);
    if (!nombre || !esNombreAccion(nombre) || !accionesDelAmbito(this.ambito).includes(nombre)) {
      // Nunca llega a la app una herramienta fuera del registro o del ámbito.
      this.enviarSalidaHerramienta(llamadaId, { estado: "fallida", mensaje: "Esa herramienta no existe en este espacio. No se hizo nada." });
      return;
    }
    let argumentos: unknown = {};
    if (typeof argumentosCrudos === "string" && argumentosCrudos.trim()) {
      try {
        argumentos = JSON.parse(argumentosCrudos);
      } catch {
        argumentos = null;
      }
    } else if (esRegistro(argumentosCrudos)) {
      argumentos = argumentosCrudos;
    }
    this.llamadasPendientes.add(llamadaId);
    this.emitir({ tipo: "accion", llamada: { llamadaId, accion: nombre, argumentos } });
  }

  private terminarRespuesta(respuesta: Record<string, unknown> | null) {
    this.respuestaActiva = false;
    const salida = Array.isArray(respuesta?.output) ? respuesta.output : [];
    const estadoRespuesta = texto(respuesta?.status);
    const cortada = estadoRespuesta === "cancelled" || estadoRespuesta === "incomplete";
    let publicoMensaje = false;
    for (const valor of salida) {
      if (!esRegistro(valor)) continue;
      if (valor.type === "function_call") {
        this.manejarLlamada(texto(valor.call_id), texto(valor.name), valor.arguments);
        continue;
      }
      const id = texto(valor.id);
      if (valor.type !== "message" || !id) continue;
      const contenido = textoDeContenido(valor.content) || this.textoParcial.get(id) || "";
      if (this.publicarMensaje(id, contenido, cortada)) publicoMensaje = true;
    }
    if (!publicoMensaje) {
      for (const [id, contenido] of this.textoParcial) this.publicarMensaje(id, contenido, cortada);
    }
    this.textoParcial.clear();
    if (estadoRespuesta === "failed") this.emitir({ tipo: "aviso", aviso: aviso("respuesta_fallida") });
    if (this.llamadasPendientes.size === 0 && !this.necesitaRespuesta && !this.reintentarRespuesta) {
      this.cambiarEstado(this.voz ? "escuchando" : "listo");
    }
    this.continuar();
  }

  private publicarMensaje(id: string, contenido: string, cortada: boolean): boolean {
    const limpio = contenido.trim();
    if (!limpio || this.publicados.has(id)) return false;
    this.publicados.add(id);
    const final = cortada && !/[.!?…»"')\]]$/.test(limpio) ? `${limpio}…` : limpio;
    const fuentes = this.fuentesPendientes;
    this.fuentesPendientes = [];
    this.emitir({ tipo: "texto_final", mensajeId: id, texto: final, ...(fuentes.length > 0 ? { fuentes } : {}) });
    return true;
  }

  private manejarError(error: Record<string, unknown> | null) {
    const codigo = texto(error?.code) ?? "";
    const origen = texto(error?.event_id) ?? "";
    // Cancelar algo que ya terminó es inofensivo; la pantalla es contexto de fondo.
    if (codigo === "response_cancel_not_active" || origen.startsWith("voz_") || origen.startsWith("pantalla")) return;
    if (codigo === "conversation_already_has_active_response") {
      this.reintentarRespuesta = true;
      return;
    }
    if (origen.startsWith("respuesta") || origen.startsWith("pregunta")) this.respuestaActiva = false;
    this.emitir({ tipo: "aviso", aviso: aviso("accion_fallida") });
    this.cambiarEstado(this.voz ? "escuchando" : "listo");
  }

  // --- Audio ---

  private async reproducir() {
    try {
      await this.audio.play();
    } catch {
      if (this.voz && !this.cerrada) this.emitir({ tipo: "aviso", aviso: aviso("audio_bloqueado") });
    }
  }

  private iniciarMedidor() {
    if (!this.microfono) return;
    try {
      this.contextoNivel = this.crearContextoAudio();
    } catch {
      this.contextoNivel = null;
    }
    const contexto = this.contextoNivel;
    if (!contexto) return;
    const analizador = contexto.createAnalyser();
    analizador.fftSize = 512;
    contexto.createMediaStreamSource(this.microfono).connect(analizador);
    this.analizadorMicrofono = analizador;
    this.conectarAnalizadorRemoto();
    const muestras = new Uint8Array(analizador.fftSize);
    let nivel = 0;
    this.temporizadorNivel = setInterval(() => {
      const fuente = this.estado === "hablando" ? this.analizadorRemoto : this.analizadorMicrofono;
      let objetivo = 0;
      if (fuente) {
        fuente.getByteTimeDomainData(muestras);
        objetivo = nivelDeMuestras(muestras);
      }
      // Sube rápido y baja despacio.
      nivel += (objetivo - nivel) * (objetivo > nivel ? 0.6 : 0.25);
      if (Math.abs(nivel - this.nivelEmitido) >= 0.02) {
        this.nivelEmitido = nivel;
        this.emitir({ tipo: "nivel_voz", nivel });
      }
    }, NIVEL_INTERVALO_MS);
  }

  private conectarAnalizadorRemoto() {
    if (!this.contextoNivel || !this.flujoRemoto || this.analizadorRemoto) return;
    try {
      const analizador = this.contextoNivel.createAnalyser();
      analizador.fftSize = 512;
      this.contextoNivel.createMediaStreamSource(this.flujoRemoto).connect(analizador);
      this.analizadorRemoto = analizador;
    } catch {
      this.analizadorRemoto = null;
    }
  }

  private detenerMedidor() {
    if (this.temporizadorNivel) clearInterval(this.temporizadorNivel);
    this.temporizadorNivel = null;
    this.analizadorMicrofono = null;
    this.analizadorRemoto = null;
    if (this.contextoNivel) void this.contextoNivel.close().catch(() => undefined);
    this.contextoNivel = null;
    this.nivelEmitido = 0;
  }

  // --- Eventos hacia la app ---

  private cambiarEstado(estado: EstadoSesionAsistente) {
    if (this.estado === estado) return;
    this.estado = estado;
    this.emitir({ tipo: "estado", estado });
  }

  private emitir(evento: EventoAsistente) {
    for (const oyente of [...this.oyentes]) {
      try {
        oyente(evento);
      } catch {
        // Un oyente con error no corta la conversación.
      }
    }
  }
}

export interface OpcionesProveedorRealtime extends DependenciasRealtime {
  /** Modelo que informó GET /api/asistente/estado (sólo para la etiqueta). */
  modelo?: string;
}

export class RealtimeAssistantProvider implements AssistantProvider {
  readonly modo = "openai_realtime" as const;
  readonly etiqueta: string;
  readonly admiteVoz = true;
  private readonly dependencias: DependenciasRealtime;

  constructor(opciones: OpcionesProveedorRealtime = {}) {
    const { modelo, ...dependencias } = opciones;
    this.dependencias = dependencias;
    this.etiqueta = modelo ? `OpenAI Realtime (${modelo})` : "OpenAI Realtime";
  }

  async iniciar(opciones: OpcionesSesionRealtime): Promise<SesionRealtime> {
    const sesion = new SesionRealtime(opciones.ambito, this.dependencias);
    await sesion.conectar(opciones);
    return sesion;
  }

  /** Pide el micrófono dentro del gesto, antes de conectar (Safari y Chrome lo agradecen). */
  async obtenerMicrofono(): Promise<MediaStream> {
    try {
      return await (this.dependencias.obtenerMicrofono ?? microfonoPredeterminado)({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (error) {
      throw errorDeMicrofono(error);
    }
  }
}
