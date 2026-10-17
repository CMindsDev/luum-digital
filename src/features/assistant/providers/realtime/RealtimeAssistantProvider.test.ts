import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AmbitoAsistente } from "@shared/asistente/acciones";
import type { EventoAsistente } from "@/services/contracts";
import { cambiarIdioma } from "@/i18n";
import { pantallaDe } from "../../runtime/__fixtures__/repositorios";
import { ErrorAsistente } from "../avisos";
import { RealtimeAssistantProvider, type SalidaAudio } from "./RealtimeAssistantProvider";

type EventoEnviado = Record<string, unknown> & { type: string };

/** Canal "oai-events" falso: guarda lo enviado y permite simular eventos del servidor. */
class CanalFalso extends EventTarget {
  readyState: "connecting" | "open" | "closing" | "closed" = "connecting";
  readonly enviados: EventoEnviado[] = [];
  onmessage: ((evento: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  abreSolo = true;

  send(datos: string) {
    this.enviados.push(JSON.parse(datos));
  }
  close() {
    this.readyState = "closed";
  }
  abrir() {
    this.readyState = "open";
    this.dispatchEvent(new Event("open"));
  }
  servidor(evento: Record<string, unknown>) {
    this.onmessage?.({ data: JSON.stringify(evento) });
  }
  tipos() {
    return this.enviados.map((evento) => evento.type);
  }
}

/** RTCPeerConnection falso (sin red ni WebRTC). */
class PeerFalso {
  static ultimo: PeerFalso | null = null;
  readonly canal = new CanalFalso();
  readonly emisor = { replaceTrack: vi.fn(async () => undefined) };
  connectionState = "new";
  onconnectionstatechange: (() => void) | null = null;
  ontrack: unknown = null;
  remota: unknown = null;
  cerrado = false;
  transceptores = 0;

  constructor() {
    PeerFalso.ultimo = this;
  }
  addTransceiver() {
    this.transceptores += 1;
    return { sender: this.emisor };
  }
  addTrack() {
    return this.emisor;
  }
  createDataChannel(etiqueta: string) {
    if (etiqueta !== "oai-events") throw new Error("canal inesperado");
    return this.canal;
  }
  async createOffer() {
    return { type: "offer", sdp: "v=0\r\no=- oferta" };
  }
  async setLocalDescription() {
    return undefined;
  }
  async setRemoteDescription(descripcion: unknown) {
    this.remota = descripcion;
    if (this.canal.abreSolo) queueMicrotask(() => this.canal.abrir());
  }
  close() {
    this.cerrado = true;
  }
  fallar() {
    this.connectionState = "failed";
    this.onconnectionstatechange?.();
  }
}

function audioFalso(): SalidaAudio & { play: ReturnType<typeof vi.fn> } {
  return { play: vi.fn(async () => undefined), pause: vi.fn(), muted: true, srcObject: null, autoplay: true };
}

function servidorFalso(respuestaConexion?: () => Response) {
  return vi.fn<typeof fetch>(async (entrada, init) => {
    const ruta = String(entrada);
    if (ruta === "/api/asistente/conexiones" && init?.method === "POST") {
      return respuestaConexion?.() ?? Response.json({ id: "conexion-propia-123456", sdp: "v=0\r\no=- respuesta", modelo: "gpt-realtime-2.1", maxSegundos: 900 }, { status: 201 });
    }
    if (ruta.startsWith("/api/asistente/conexiones/") && init?.method === "DELETE") return new Response(null, { status: 204 });
    throw new Error(`Red bloqueada en pruebas: ${ruta}`);
  });
}

async function conectar(opciones: { ambito?: AmbitoAsistente; fetch?: ReturnType<typeof servidorFalso>; tiempoCanalMs?: number } = {}) {
  const fetchFalso = opciones.fetch ?? servidorFalso();
  const proveedor = new RealtimeAssistantProvider({
    fetch: fetchFalso,
    crearAudio: audioFalso,
    crearContextoAudio: () => null,
    obtenerMicrofono: async () => {
      throw new DOMException("Permiso denegado", "NotAllowedError");
    },
    pantallaDebounceMs: 400,
    ...(opciones.tiempoCanalMs ? { tiempoCanalMs: opciones.tiempoCanalMs } : {}),
  });
  const sesion = await proveedor.iniciar({ ambito: opciones.ambito ?? "general", pantalla: pantallaDe() });
  const peer = PeerFalso.ultimo;
  if (!peer) throw new Error("No se creó el peer");
  const eventos: EventoAsistente[] = [];
  sesion.suscribir((evento) => eventos.push(evento));
  return { sesion, peer, canal: peer.canal, eventos, fetchFalso, proveedor };
}

beforeEach(() => {
  PeerFalso.ultimo = null;
  vi.stubGlobal("RTCPeerConnection", PeerFalso);
});

afterEach(async () => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  await cambiarIdioma("es");
});

describe("RealtimeAssistantProvider", () => {
  it("se declara como IA real con voz, distinto del demo", () => {
    const proveedor = new RealtimeAssistantProvider({ modelo: "gpt-realtime-2.1" });
    expect(proveedor).toMatchObject({ modo: "openai_realtime", admiteVoz: true, etiqueta: "OpenAI Realtime (gpt-realtime-2.1)" });
  });

  it("negocia por el servidor: oferta SDP + pantalla, respuesta SDP, canal oai-events y pista silenciosa", async () => {
    const { fetchFalso, peer, sesion } = await conectar();
    const [ruta, init] = fetchFalso.mock.calls[0] ?? [];
    expect(ruta).toBe("/api/asistente/conexiones");
    const cuerpo: unknown = JSON.parse(String(init?.body));
    expect(cuerpo).toMatchObject({ ambito: "general", idioma: "es", sdp: "v=0\r\no=- oferta", pantalla: { ruta: "/", seccion: "inicio" } });
    expect(JSON.stringify(cuerpo)).not.toMatch(/sk-|api[_-]?key/i);
    expect(peer.remota).toEqual({ type: "answer", sdp: "v=0\r\no=- respuesta" });
    // Sin AudioContext se negocia un transceptor de audio (nunca se pide el micrófono al conectar).
    expect(peer.transceptores).toBe(1);
    expect(peer.canal.readyState).toBe("open");

    sesion.cerrar();
    expect(peer.cerrado).toBe(true);
    expect(fetchFalso).toHaveBeenLastCalledWith("/api/asistente/conexiones/conexion-propia-123456", expect.objectContaining({ method: "DELETE", keepalive: true }));
  });

  it.each(["general", "bienestar"] as const)("envía el idioma maya al abrir una sesión de %s", async (ambito) => {
    await cambiarIdioma("yua");
    const { fetchFalso, sesion } = await conectar({ ambito });
    const cuerpo: unknown = JSON.parse(String(fetchFalso.mock.calls[0]?.[1]?.body));
    expect(cuerpo).toMatchObject({ ambito, idioma: "yua" });
    sesion.cerrar();
  });

  it("envía texto como ítem de usuario y pide una respuesta; los deltas y el texto final llegan como eventos", async () => {
    const { sesion, canal, eventos } = await conectar();
    sesion.enviarTexto("Quiero reportar un bache");
    expect(canal.tipos()).toEqual(["conversation.item.create", "response.create"]);
    expect(canal.enviados[0]).toMatchObject({ item: { type: "message", role: "user", content: [{ type: "input_text", text: "Quiero reportar un bache" }] } });

    canal.servidor({ type: "response.created", response: { id: "resp_1" } });
    canal.servidor({ type: "response.output_text.delta", item_id: "item_1", delta: "Claro, " });
    canal.servidor({ type: "response.output_text.delta", item_id: "item_1", delta: "te ayudo." });
    canal.servidor({
      type: "response.done",
      response: { id: "resp_1", status: "completed", output: [{ id: "item_1", type: "message", content: [{ type: "output_text", text: "Claro, te ayudo." }] }] },
    });
    expect(eventos.filter((evento) => evento.tipo === "texto_delta").map((evento) => (evento.tipo === "texto_delta" ? evento.texto : ""))).toEqual(["Claro, ", "te ayudo."]);
    expect(eventos).toContainEqual({ tipo: "texto_final", mensajeId: "item_1", texto: "Claro, te ayudo." });
    expect(eventos.at(-1)).toEqual({ tipo: "estado", estado: "listo" });
  });

  it("emite acciones y responde con function_call_output y un solo response.create cuando llegan todos los recibos", async () => {
    const { sesion, canal, eventos } = await conectar();
    sesion.enviarTexto("Busca la licencia y abre el mapa");
    canal.enviados.length = 0;
    canal.servidor({ type: "response.created", response: { id: "resp_2" } });
    canal.servidor({ type: "response.function_call_arguments.done", call_id: "call_a", name: "buscarServicios", arguments: '{"consulta":"licencia"}' });
    canal.servidor({ type: "response.function_call_arguments.done", call_id: "call_b", name: "abrirMapa", arguments: "{}" });
    canal.servidor({
      type: "response.done",
      response: {
        id: "resp_2",
        status: "completed",
        output: [
          { type: "function_call", call_id: "call_a", name: "buscarServicios", arguments: '{"consulta":"licencia"}' },
          { type: "function_call", call_id: "call_b", name: "abrirMapa", arguments: "{}" },
        ],
      },
    });
    const acciones = eventos.flatMap((evento) => (evento.tipo === "accion" ? [evento.llamada] : []));
    expect(acciones).toEqual([
      { llamadaId: "call_a", accion: "buscarServicios", argumentos: { consulta: "licencia" } },
      { llamadaId: "call_b", accion: "abrirMapa", argumentos: {} },
    ]);
    expect(canal.tipos()).toEqual([]);

    sesion.entregarRecibo({
      llamadaId: "call_a",
      accion: "buscarServicios",
      estado: "completada",
      mensaje: "Encontré 1 servicio.",
      datos: { fuentes: [{ titulo: "Fuente oficial de prueba", url: "https://example.org" }] },
    });
    expect(canal.tipos()).toEqual(["conversation.item.create"]);
    expect(canal.enviados[0]).toMatchObject({ item: { type: "function_call_output", call_id: "call_a" } });
    const salida: unknown = JSON.parse(String((canal.enviados[0]?.item as { output: string }).output));
    expect(salida).toMatchObject({ estado: "completada", mensaje: "Encontré 1 servicio." });

    sesion.entregarRecibo({ llamadaId: "call_b", accion: "abrirMapa", estado: "completada", mensaje: "Abrí el mapa." });
    expect(canal.tipos()).toEqual(["conversation.item.create", "conversation.item.create", "response.create"]);

    // Un recibo repetido o desconocido no vuelve a pedir respuesta.
    sesion.entregarRecibo({ llamadaId: "call_b", accion: "abrirMapa", estado: "completada", mensaje: "Otra vez." });
    expect(canal.tipos().filter((tipo) => tipo === "response.create")).toHaveLength(1);

    canal.servidor({ type: "response.created", response: { id: "resp_3" } });
    canal.servidor({
      type: "response.done",
      response: { id: "resp_3", status: "completed", output: [{ id: "item_3", type: "message", content: [{ type: "output_text", text: "Listo." }] }] },
    });
    expect(eventos).toContainEqual({ tipo: "texto_final", mensajeId: "item_3", texto: "Listo.", fuentes: [{ titulo: "Fuente oficial de prueba", url: "https://example.org" }] });
  });

  it("nunca pasa a la app herramientas fuera del registro o del ámbito: responde fallida por su cuenta", async () => {
    const { canal, eventos } = await conectar({ ambito: "bienestar" });
    canal.servidor({ type: "response.created", response: { id: "r" } });
    canal.servidor({ type: "response.function_call_arguments.done", call_id: "call_x", name: "borrarTodo", arguments: "{}" });
    canal.servidor({ type: "response.function_call_arguments.done", call_id: "call_y", name: "navegar", arguments: '{"seccion":"mapa"}' });
    canal.servidor({ type: "response.done", response: { id: "r", status: "completed", output: [] } });
    expect(eventos.some((evento) => evento.tipo === "accion")).toBe(false);
    const salidas = canal.enviados.filter((evento) => evento.type === "conversation.item.create");
    expect(salidas).toHaveLength(2);
    expect(JSON.stringify(salidas)).toContain("fallida");
    expect(canal.tipos().filter((tipo) => tipo === "response.create")).toHaveLength(1);
  });

  it("mantiene un único ítem «[Pantalla actual]» que se reemplaza con debounce", async () => {
    const { sesion, canal } = await conectar();
    vi.useFakeTimers();
    sesion.actualizarPantalla(pantallaDe({ ruta: "/reportes", titulo: "Reportes", seccion: "reportes" }));
    sesion.actualizarPantalla(pantallaDe({ ruta: "/mapa", titulo: "Visor Urbano", seccion: "mapa" }));
    expect(canal.enviados).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(450);
    expect(canal.tipos()).toEqual(["conversation.item.create"]);
    const primero = canal.enviados[0]?.item as { id: string; role: string; content: { text: string }[] };
    expect(primero.role).toBe("system");
    expect(primero.content[0]?.text).toContain("[Pantalla actual]");
    expect(primero.content[0]?.text).toContain("Ruta: /mapa");

    sesion.actualizarPantalla(pantallaDe({ ruta: "/gestiones", titulo: "Mis gestiones", seccion: "gestiones" }));
    await vi.advanceTimersByTimeAsync(450);
    expect(canal.tipos()).toEqual(["conversation.item.create", "conversation.item.delete", "conversation.item.create"]);
    expect(canal.enviados[1]).toMatchObject({ item_id: primero.id });

    // Sin cambios, no se reenvía.
    sesion.actualizarPantalla(pantallaDe({ ruta: "/gestiones", titulo: "Mis gestiones", seccion: "gestiones" }));
    await vi.advanceTimersByTimeAsync(450);
    expect(canal.enviados).toHaveLength(3);
  });

  it("sin clave en el servidor rechaza con un aviso legible y no deja la conexión abierta", async () => {
    const fetchFalso = servidorFalso(() =>
      Response.json({ error: "El asistente con IA no está configurado en este servidor.", codigo: "sin_configuracion" }, { status: 503 }),
    );
    const error = await conectar({ fetch: fetchFalso }).catch((motivo: unknown) => motivo);
    expect(error).toBeInstanceOf(ErrorAsistente);
    expect(error instanceof ErrorAsistente ? error.aviso.titulo : "").toBe("No pude conectarme ahora");
    expect(PeerFalso.ultimo?.cerrado).toBe(true);
    expect(fetchFalso).toHaveBeenCalledTimes(1);
  });

  it("si el servidor rechaza la pantalla, reintenta con una pantalla mínima", async () => {
    let intentos = 0;
    const fetchFalso = servidorFalso(() => {
      intentos += 1;
      return intentos === 1
        ? Response.json({ error: "La pantalla enviada no es válida.", codigo: "pantalla_invalida" }, { status: 422 })
        : Response.json({ id: "conexion-propia-123456", sdp: "v=0\r\no=- respuesta", modelo: "m", maxSegundos: 60 }, { status: 201 });
    });
    await conectar({ fetch: fetchFalso });
    const segundo: unknown = JSON.parse(String(fetchFalso.mock.calls[1]?.[1]?.body));
    expect(segundo).toMatchObject({ pantalla: { objetivos: [], formulario: null } });
  });

  it("si el canal no abre a tiempo, avisa y cuelga en el servidor", async () => {
    const fetchFalso = servidorFalso();
    const original = PeerFalso.prototype.createDataChannel;
    vi.spyOn(PeerFalso.prototype, "createDataChannel").mockImplementation(function (this: PeerFalso, etiqueta: string) {
      const canal = original.call(this, etiqueta);
      canal.abreSolo = false;
      return canal;
    });
    const error = await conectar({ fetch: fetchFalso, tiempoCanalMs: 20 }).catch((motivo: unknown) => motivo);
    expect(error instanceof ErrorAsistente ? error.aviso.titulo : "").toBe("La conexión tardó demasiado");
    expect(fetchFalso).toHaveBeenLastCalledWith("/api/asistente/conexiones/conexion-propia-123456", expect.objectContaining({ method: "DELETE" }));
  });

  it("avisa si el micrófono está bloqueado y si se corta la red", async () => {
    const { sesion, peer, eventos } = await conectar();
    await expect(sesion.iniciarVoz?.()).rejects.toBeInstanceOf(ErrorAsistente);
    expect(eventos).toContainEqual({ tipo: "aviso", aviso: expect.objectContaining({ titulo: "No pude usar el micrófono", accion: "escribir" }) });

    peer.fallar();
    expect(eventos).toContainEqual({ tipo: "aviso", aviso: expect.objectContaining({ titulo: "Se perdió la conexión", accion: "reconectar" }) });
    expect(eventos.at(-1)).toEqual({ tipo: "estado", estado: "cerrado" });
    expect(peer.cerrado).toBe(true);
  });

  it("publica la transcripción de la persona en voz", async () => {
    const { canal, eventos } = await conectar();
    canal.servidor({ type: "conversation.item.input_audio_transcription.completed", item_id: "voz_1", transcript: "Hay un bache" });
    expect(eventos).toContainEqual({ tipo: "transcripcion_usuario", mensajeId: "voz_1", texto: "Hay un bache" });
  });
});
