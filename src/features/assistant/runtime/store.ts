/**
 * Estado de interfaz del asistente, SIN persistencia (nada en localStorage, URLs ni analítica).
 *
 * Hay dos instancias separadas: "general" y "bienestar". Nunca comparten mensajes: el asistente
 * general no puede leer ni resumir lo que se conversa en bienestar. `resetear()` borra todo al
 * cerrar la conversación.
 */
import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";
import { ACCIONES, type AmbitoAsistente, type NombreAccion, type ReciboAccion } from "@shared/asistente/acciones";
import type { MensajeReciente } from "@shared/asistente/servidor";
import { LIMITES_GUARDAS } from "@shared/asistente/servidor";
import type {
  AvisoAsistente,
  EstadoSesionAsistente,
  EventoAsistente,
  FuenteCitada,
  LlamadaAccion,
  ModoAsistente,
} from "@/services/contracts";

/** Límites de memoria de una conversación (sólo vive en esta pestaña). */
export const LIMITES_STORE = { mensajes: 120, recibos: 30, avisos: 4 } as const;

export interface MensajeConversacion {
  id: string;
  rol: "persona" | "asistente";
  texto: string;
  /** true mientras llegan deltas del asistente. */
  pendiente: boolean;
  origen: "texto" | "voz";
  fuentes?: FuenteCitada[];
}

export interface AccionEnCurso {
  llamadaId: string;
  accion: NombreAccion;
  /** Texto breve para la interfaz («Buscando en el catálogo…»). */
  estadoTexto: string;
}

export interface AvisoVisible extends AvisoAsistente {
  id: string;
}

export interface DatosAsistente {
  readonly ambito: AmbitoAsistente;
  mensajes: MensajeConversacion[];
  estadoSesion: EstadoSesionAsistente;
  modo: ModoAsistente | null;
  /** Etiqueta visible del proveedor («Respuestas programadas (demostración)»…). */
  etiquetaModo: string | null;
  vozActiva: boolean;
  /** 0..1 */
  nivelVoz: number;
  avisos: AvisoVisible[];
  accionesEnCurso: AccionEnCurso[];
  recibos: ReciboAccion[];
  /**
   * Posición de cada acción en el historial: cuántos mensajes había cuando empezó (o, si no se vio
   * empezar, cuando llegó su recibo). La interfaz intercala los recibos con los mensajes.
   */
  anclasRecibos: Record<string, number>;
}

export interface AccionesAsistente {
  aplicarEvento(evento: EventoAsistente): void;
  /** Agrega lo que escribió la persona. Devuelve el id del mensaje. */
  agregarMensajePersona(texto: string, origen?: MensajeConversacion["origen"]): string;
  iniciarAccion(llamada: LlamadaAccion): void;
  registrarRecibo(recibo: ReciboAccion): void;
  agregarAviso(aviso: AvisoAsistente): void;
  descartarAviso(id: string): void;
  establecerModo(modo: ModoAsistente | null, etiqueta: string | null): void;
  establecerVoz(activa: boolean): void;
  /** Mensajes recientes para la guarda de acción (máx. 6 × 400 caracteres). */
  mensajesRecientes(): MensajeReciente[];
  /** Borra la conversación completa (al cerrar o al pulsar «Borrar conversación»). */
  resetear(): void;
}

export type EstadoAsistente = DatosAsistente & AccionesAsistente;
export type StoreAsistente = StoreApi<EstadoAsistente>;

let contador = 0;
function nuevoId(prefijo: string): string {
  contador += 1;
  return `${prefijo}-${Date.now().toString(36)}-${contador.toString(36)}`;
}

function inicial(ambito: AmbitoAsistente): DatosAsistente {
  return {
    ambito,
    mensajes: [],
    estadoSesion: "inactivo",
    modo: null,
    etiquetaModo: null,
    vozActiva: false,
    nivelVoz: 0,
    avisos: [],
    accionesEnCurso: [],
    recibos: [],
    anclasRecibos: {},
  };
}

function recortar<T>(lista: T[], maximo: number): T[] {
  return lista.length > maximo ? lista.slice(lista.length - maximo) : lista;
}

function conMensaje(mensajes: MensajeConversacion[], mensaje: MensajeConversacion): MensajeConversacion[] {
  const indice = mensajes.findIndex((existente) => existente.id === mensaje.id);
  if (indice === -1) return recortar([...mensajes, mensaje], LIMITES_STORE.mensajes);
  const copia = [...mensajes];
  copia[indice] = mensaje;
  return copia;
}

/** Fábrica de stores aislados. Cada llamada crea una conversación nueva e independiente. */
export function createAssistantStore(ambito: AmbitoAsistente): StoreAsistente {
  return createStore<EstadoAsistente>()((set, get) => ({
    ...inicial(ambito),

    aplicarEvento(evento) {
      switch (evento.tipo) {
        case "estado":
          set({ estadoSesion: evento.estado, ...(evento.estado === "cerrado" ? { vozActiva: false, nivelVoz: 0 } : {}) });
          return;
        case "texto_delta": {
          const previo = get().mensajes.find((mensaje) => mensaje.id === evento.mensajeId);
          const texto = `${previo?.texto ?? ""}${evento.texto}`;
          set({
            mensajes: conMensaje(get().mensajes, {
              id: evento.mensajeId,
              rol: "asistente",
              texto,
              pendiente: true,
              origen: previo?.origen ?? (get().vozActiva ? "voz" : "texto"),
            }),
          });
          return;
        }
        case "texto_final": {
          const previo = get().mensajes.find((mensaje) => mensaje.id === evento.mensajeId);
          const texto = evento.texto.trim();
          if (!texto && !previo) return;
          set({
            mensajes: conMensaje(get().mensajes, {
              id: evento.mensajeId,
              rol: "asistente",
              texto: texto || previo?.texto || "",
              pendiente: false,
              origen: previo?.origen ?? (get().vozActiva ? "voz" : "texto"),
              ...(evento.fuentes && evento.fuentes.length > 0 ? { fuentes: evento.fuentes } : {}),
            }),
          });
          return;
        }
        case "transcripcion_usuario": {
          const texto = evento.texto.trim();
          if (!texto) return;
          set({
            mensajes: conMensaje(get().mensajes, { id: evento.mensajeId, rol: "persona", texto, pendiente: false, origen: "voz" }),
          });
          return;
        }
        case "accion":
          get().iniciarAccion(evento.llamada);
          return;
        case "aviso":
          get().agregarAviso(evento.aviso);
          return;
        case "nivel_voz":
          set({ nivelVoz: Math.min(1, Math.max(0, evento.nivel)) });
          return;
      }
    },

    agregarMensajePersona(texto, origen = "texto") {
      const id = nuevoId("persona");
      set({ mensajes: conMensaje(get().mensajes, { id, rol: "persona", texto: texto.trim(), pendiente: false, origen }) });
      return id;
    },

    iniciarAccion(llamada) {
      if (get().accionesEnCurso.some((accion) => accion.llamadaId === llamada.llamadaId)) return;
      set({
        accionesEnCurso: [
          ...get().accionesEnCurso,
          { llamadaId: llamada.llamadaId, accion: llamada.accion, estadoTexto: ACCIONES[llamada.accion].estado },
        ],
        anclasRecibos: { ...get().anclasRecibos, [llamada.llamadaId]: get().anclasRecibos[llamada.llamadaId] ?? get().mensajes.length },
      });
    },

    registrarRecibo(recibo) {
      const recibos = recortar([...get().recibos.filter((previo) => previo.llamadaId !== recibo.llamadaId), recibo], LIMITES_STORE.recibos);
      const anclas: Record<string, number> = {};
      for (const { llamadaId } of recibos) anclas[llamadaId] = get().anclasRecibos[llamadaId] ?? get().mensajes.length;
      for (const { llamadaId } of get().accionesEnCurso) {
        const ancla = get().anclasRecibos[llamadaId];
        if (ancla !== undefined) anclas[llamadaId] = ancla;
      }
      set({
        accionesEnCurso: get().accionesEnCurso.filter((accion) => accion.llamadaId !== recibo.llamadaId),
        recibos,
        anclasRecibos: anclas,
      });
    },

    agregarAviso(aviso) {
      // El mismo aviso no se apila: se reemplaza por el más reciente.
      const otros = get().avisos.filter((previo) => previo.titulo !== aviso.titulo);
      set({ avisos: recortar([...otros, { ...aviso, id: nuevoId("aviso") }], LIMITES_STORE.avisos) });
    },

    descartarAviso(id) {
      set({ avisos: get().avisos.filter((aviso) => aviso.id !== id) });
    },

    establecerModo(modo, etiqueta) {
      set({ modo, etiquetaModo: etiqueta });
    },

    establecerVoz(activa) {
      set({ vozActiva: activa, ...(activa ? {} : { nivelVoz: 0 }) });
    },

    mensajesRecientes() {
      return get()
        .mensajes.filter((mensaje) => !mensaje.pendiente && mensaje.texto)
        .slice(-LIMITES_GUARDAS.mensajes)
        .map((mensaje) => ({ rol: mensaje.rol, texto: mensaje.texto.slice(0, LIMITES_GUARDAS.caracteresPorMensaje) }));
    },

    resetear() {
      set(inicial(ambito));
    },
  }));
}

/** Conversación del asistente general (catálogo, reportes, navegación). */
export const storeAsistenteGeneral: StoreAsistente = createAssistantStore("general");
/** Conversación del acompañante de bienestar. Aislada del asistente general. */
export const storeAsistenteBienestar: StoreAsistente = createAssistantStore("bienestar");

export function obtenerStoreAsistente(ambito: AmbitoAsistente): StoreAsistente {
  return ambito === "bienestar" ? storeAsistenteBienestar : storeAsistenteGeneral;
}

/** Hook de lectura para la interfaz: `useAsistenteStore("general", (s) => s.mensajes)`. */
export function useAsistenteStore<T>(ambito: AmbitoAsistente, selector: (estado: EstadoAsistente) => T): T {
  return useStore(obtenerStoreAsistente(ambito), selector);
}
