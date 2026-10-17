/**
 * Estado de INTERFAZ de Pekito (Zustand, sin persistencia salvo el lado preferido, que es una
 * preferencia no sensible). La conversación vive aparte, en el store del runtime (sólo memoria).
 */
import { create } from "zustand";
import { guardarPreferenciasPekito, leerPreferenciasPekito, type LadoPekito } from "./pekito-preferencias";

/** Lanzador «Por texto o por voz», conversación escrita o llamada de voz. */
export type VistaPekito = "lanzador" | "chat" | "llamada";

interface DatosUIPekito {
  abierto: boolean;
  /** El panel ya se abrió alguna vez: desde entonces su código está cargado y montado. */
  panelMontado: boolean;
  vista: VistaPekito;
  bienvenidaAbierta: boolean;
  lado: LadoPekito;
  /** Texto del compositor: los chips y abrirPekito() lo prellenan; nunca se envía solo. */
  borrador: string;
  /** Alguien pidió enfocar el compositor (chips, «Escribir», abrirPekito); el compositor lo consume al enfocarse. */
  enfoquePendiente: boolean;
  /** Último mensaje del asistente que la persona ya vio (la píldora no lo repite). */
  mensajeVisto: string | null;
  /** Último aviso que ya ocupó la píldora. */
  avisoVisto: string | null;
}

interface AccionesUIPekito {
  abrir(vista?: VistaPekito): void;
  cerrar(): void;
  cambiarVista(vista: VistaPekito): void;
  abrirBienvenida(): void;
  cerrarBienvenida(): void;
  moverA(lado: LadoPekito): void;
  cambiarBorrador(texto: string): void;
  /** Prellena el compositor y lo enfoca (no envía). */
  prellenar(texto: string): void;
  /** Pide enfocar el compositor sin cambiar su texto. */
  pedirEnfoque(): void;
  consumirEnfoque(): void;
  marcarMensajeVisto(id: string | null): void;
  marcarAvisoVisto(id: string | null): void;
  /** La ayuda humana se muestra dentro de la conversación: abre el chat donde está la tarjeta. */
  mostrarApoyo(): void;
  /** Tras «Borrar conversación»: vuelve al lanzador sin borrador. */
  reiniciarConversacion(): void;
}

export type EstadoUIPekito = DatosUIPekito & AccionesUIPekito;

export const usePekitoUI = create<EstadoUIPekito>()((set) => ({
  abierto: false,
  panelMontado: false,
  vista: "lanzador",
  bienvenidaAbierta: false,
  lado: leerPreferenciasPekito().lado,
  borrador: "",
  enfoquePendiente: false,
  mensajeVisto: null,
  avisoVisto: null,

  abrir: (vista) => set((estado) => ({ abierto: true, panelMontado: true, bienvenidaAbierta: false, vista: vista ?? estado.vista })),
  cerrar: () => set({ abierto: false }),
  cambiarVista: (vista) => set({ vista }),
  abrirBienvenida: () => set({ bienvenidaAbierta: true, abierto: false }),
  cerrarBienvenida: () => set({ bienvenidaAbierta: false }),
  moverA: (lado) => {
    guardarPreferenciasPekito({ lado });
    set({ lado });
  },
  cambiarBorrador: (borrador) => set({ borrador }),
  prellenar: (texto) => set({ borrador: texto, enfoquePendiente: true }),
  marcarMensajeVisto: (mensajeVisto) => set({ mensajeVisto }),
  marcarAvisoVisto: (avisoVisto) => set({ avisoVisto }),
  pedirEnfoque: () => set({ enfoquePendiente: true }),
  consumirEnfoque: () => set({ enfoquePendiente: false }),
  mostrarApoyo: () => set((estado) => ({ abierto: true, panelMontado: true, bienvenidaAbierta: false, vista: estado.vista === "llamada" ? "llamada" : "chat" })),
  reiniciarConversacion: () => set({ vista: "lanzador", borrador: "", mensajeVisto: null, avisoVisto: null }),
}));

/**
 * API pública para otros módulos: abre Pekito en la conversación escrita. Si se da `texto`, lo deja
 * escrito en el compositor para que la persona lo revise y lo envíe (nunca lo envía solo).
 */
export function abrirPekito(opciones: { texto?: string } = {}): void {
  const estado = usePekitoUI.getState();
  if (opciones.texto?.trim()) estado.prellenar(opciones.texto.trim().slice(0, 500));
  estado.abrir("chat");
}
