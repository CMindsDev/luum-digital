/**
 * Controlador de una conversación: une proveedor (demo o Realtime), store, ejecutor, pantalla y
 * guardas. Es la entrada recomendada para la interfaz del asistente.
 *
 *   const controlador = crearControladorAsistente({ ambito: "general", proveedor, repositorios,
 *     obtenerActor, navegar });
 *   await controlador.iniciar();
 *   controlador.enviarTexto("Quiero reportar un bache");
 *   const dejar = controlador.observarPantalla();   // «[Pantalla actual]» al cambiar el DOM
 *   controlador.cerrar();                           // cuelga y borra la conversación
 */
import type { AmbitoAsistente } from "@shared/asistente/acciones";
import type { PantallaActual } from "@shared/asistente/pantalla";
import type { AssistantProvider, AvisoAsistente, EventoAsistente, LlamadaAccion, SesionAsistente } from "@/services/contracts";
import type { IdentidadDemo } from "@/types";
import { aviso, ErrorAsistente } from "../providers/avisos";
import { RealtimeAssistantProvider, SesionRealtime, type OpcionesSesionRealtime } from "../providers/realtime/RealtimeAssistantProvider";
import { ejecutarAccion, type MotivoApoyo, type NavegarAsistente, type RepositoriosEjecutor } from "./ejecutor";
import { crearClienteGuardas, type ClienteGuardas } from "./guardas";
import { construirPantalla, observarPantalla } from "./pantalla";
import { obtenerStoreAsistente, type StoreAsistente } from "./store";

export interface OpcionesControlador {
  ambito: AmbitoAsistente;
  proveedor: AssistantProvider;
  repositorios: RepositoriosEjecutor;
  /** Identidad ficticia activa (se lee al ejecutar cada acción). */
  obtenerActor: () => IdentidadDemo;
  /** navigate de React Router. */
  navegar: NavegarAsistente;
  /** Por defecto, construirPantalla() con el rol del actor. */
  obtenerPantalla?: () => PantallaActual;
  /** Abre el panel de ayuda humana (si no, se navega a la sección de ayuda). */
  abrirApoyoHumano?: (motivo: MotivoApoyo) => void;
  /** Guardas Clef para nivel B. Por defecto, el cliente HTTP; null las desactiva. */
  guardas?: ClienteGuardas | null;
  /** Por defecto, el store del ámbito (general o bienestar). */
  store?: StoreAsistente;
  /** Bienestar con IA real: consentimiento explícito de la persona. */
  consentimientoBienestar?: boolean;
  /** Nombre ficticio para saludar (sólo si la privacidad lo permite). */
  nombreParaSaludo?: string;
}

export type ResultadoInicio = { ok: true } | { ok: false; aviso: AvisoAsistente };

export interface ControladorAsistente {
  readonly ambito: AmbitoAsistente;
  readonly proveedor: AssistantProvider;
  readonly store: StoreAsistente;
  /** Sesión activa (null si no ha iniciado o se cerró). */
  readonly sesion: SesionAsistente | null;
  iniciar(): Promise<ResultadoInicio>;
  /** Agrega el mensaje de la persona y lo envía (inicia la sesión si hace falta). */
  enviarTexto(texto: string): Promise<void>;
  /** Llamar dentro del gesto de la persona. Devuelve false si no se pudo (el aviso ya está en el store). */
  iniciarVoz(): Promise<boolean>;
  detenerVoz(): void;
  /** Silencia o reactiva el micrófono sin colgar (sólo OpenAI Realtime). Devuelve false si no aplica. */
  silenciarVoz(silenciado: boolean): boolean;
  /** Descarta la sesión actual (p. ej. tras «Se cortó la conexión») y abre otra. */
  reconectar(): Promise<ResultadoInicio>;
  /** Envía la pantalla vigente (o la dada) al proveedor. */
  actualizarPantalla(pantalla?: PantallaActual): void;
  /** Observa el DOM y actualiza «[Pantalla actual]» al cambiar. Devuelve con qué dejar de observar. */
  observarPantalla(debounceMs?: number): () => void;
  /** Cambia de proveedor conservando los mensajes visibles (cierra la sesión anterior). */
  cambiarProveedor(proveedor: AssistantProvider): void;
  /** Cuelga y borra la conversación (store sin persistencia). */
  cerrar(): void;
}

export function crearControladorAsistente(opciones: OpcionesControlador): ControladorAsistente {
  const { ambito, repositorios, obtenerActor, navegar, abrirApoyoHumano } = opciones;
  const store = opciones.store ?? obtenerStoreAsistente(ambito);
  const guardas = opciones.guardas === undefined ? crearClienteGuardas() : opciones.guardas;
  const obtenerPantalla = opciones.obtenerPantalla ?? (() => construirPantalla({ rol: obtenerActor().rol }));
  let proveedor = opciones.proveedor;
  let sesion: SesionAsistente | null = null;
  let desuscribir: (() => void) | null = null;
  let iniciando: Promise<ResultadoInicio> | null = null;
  let cadenaAcciones: Promise<void> = Promise.resolve();

  const ejecutar = (llamada: LlamadaAccion, sesionDeLlamada: SesionAsistente) => {
    cadenaAcciones = cadenaAcciones
      .then(async () => {
        const recibo = await ejecutarAccion(llamada, {
          ambito,
          repositorios,
          actor: obtenerActor(),
          navegar,
          pantalla: obtenerPantalla(),
          ...(abrirApoyoHumano ? { abrirApoyoHumano } : {}),
          ...(guardas ? { guardas } : {}),
          mensajesRecientes: store.getState().mensajesRecientes(),
        });
        store.getState().registrarRecibo(recibo);
        if (sesion === sesionDeLlamada) sesionDeLlamada.entregarRecibo(recibo);
      })
      .catch(() => undefined);
  };

  const desconectar = () => {
    desuscribir?.();
    desuscribir = null;
    sesion?.cerrar();
    sesion = null;
    iniciando = null;
  };

  const alEvento = (evento: EventoAsistente, sesionDelEvento: SesionAsistente) => {
    store.getState().aplicarEvento(evento);
    if (evento.tipo === "accion") ejecutar(evento.llamada, sesionDelEvento);
    // La sesión se cerró sola (red cortada, tiempo máximo): el siguiente mensaje abre otra.
    if (evento.tipo === "estado" && evento.estado === "cerrado" && sesion === sesionDelEvento) {
      desuscribir?.();
      desuscribir = null;
      sesion = null;
      iniciando = null;
    }
  };

  async function abrir(): Promise<ResultadoInicio> {
    const estado = store.getState();
    estado.establecerModo(proveedor.modo, proveedor.etiqueta);
    estado.aplicarEvento({ tipo: "estado", estado: "conectando" });
    const opcionesSesion: OpcionesSesionRealtime = {
      ambito,
      pantalla: obtenerPantalla(),
      ...(opciones.nombreParaSaludo ? { nombreParaSaludo: opciones.nombreParaSaludo } : {}),
      ...(opciones.consentimientoBienestar !== undefined ? { consentimientoBienestar: opciones.consentimientoBienestar } : {}),
    };
    try {
      const nueva = await proveedor.iniciar(opcionesSesion);
      sesion = nueva;
      desuscribir = nueva.suscribir((evento) => alEvento(evento, nueva));
      store.getState().aplicarEvento({ tipo: "estado", estado: "listo" });
      return { ok: true };
    } catch (error) {
      const avisoInicio = error instanceof ErrorAsistente ? error.aviso : aviso("conexion_fallida");
      store.getState().agregarAviso(avisoInicio);
      store.getState().aplicarEvento({ tipo: "estado", estado: "inactivo" });
      iniciando = null;
      return { ok: false, aviso: avisoInicio };
    }
  }

  const controlador: ControladorAsistente = {
    ambito,
    store,
    get proveedor() {
      return proveedor;
    },
    get sesion() {
      return sesion;
    },

    iniciar() {
      if (sesion) return Promise.resolve({ ok: true });
      iniciando ??= abrir();
      return iniciando;
    },

    async enviarTexto(texto) {
      const limpio = texto.trim();
      if (!limpio) return;
      store.getState().agregarMensajePersona(limpio, "texto");
      const inicio = await controlador.iniciar();
      if (inicio.ok) sesion?.enviarTexto(limpio);
    },

    async iniciarVoz() {
      if (!proveedor.admiteVoz) return false;
      try {
        // El micrófono se pide primero, todavía dentro del gesto de la persona.
        const microfono = proveedor instanceof RealtimeAssistantProvider ? await proveedor.obtenerMicrofono() : undefined;
        const inicio = await controlador.iniciar();
        if (!inicio.ok) {
          for (const pista of microfono?.getTracks() ?? []) pista.stop();
          return false;
        }
        if (sesion instanceof SesionRealtime) await sesion.iniciarVoz(microfono);
        else await sesion?.iniciarVoz?.();
        store.getState().establecerVoz(true);
        return true;
      } catch (error) {
        if (error instanceof ErrorAsistente) store.getState().agregarAviso(error.aviso);
        else store.getState().agregarAviso(aviso("microfono_no_disponible"));
        return false;
      }
    },

    detenerVoz() {
      sesion?.detenerVoz?.();
      store.getState().establecerVoz(false);
    },

    silenciarVoz(silenciado) {
      if (!(sesion instanceof SesionRealtime)) return false;
      sesion.silenciarMicrofono(silenciado);
      return true;
    },

    reconectar() {
      desconectar();
      store.getState().establecerVoz(false);
      return controlador.iniciar();
    },

    actualizarPantalla(pantalla) {
      sesion?.actualizarPantalla(pantalla ?? obtenerPantalla());
    },

    observarPantalla(debounceMs) {
      return observarPantalla((pantalla) => sesion?.actualizarPantalla(pantalla), {
        obtenerRol: () => obtenerActor().rol,
        ...(debounceMs !== undefined ? { debounceMs } : {}),
      });
    },

    cambiarProveedor(nuevo) {
      if (nuevo === proveedor) return;
      desconectar();
      store.getState().establecerVoz(false);
      proveedor = nuevo;
      store.getState().establecerModo(nuevo.modo, nuevo.etiqueta);
      store.getState().aplicarEvento({ tipo: "estado", estado: "inactivo" });
    },

    cerrar() {
      desconectar();
      store.getState().resetear();
    },
  };
  return controlador;
}
