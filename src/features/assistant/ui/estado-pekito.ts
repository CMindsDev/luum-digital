/**
 * Estado de INTERFAZ de Pekito (Zustand, sin persistencia salvo el lado preferido, que es una
 * preferencia no sensible). La conversación vive aparte, en el store del runtime (sólo memoria).
 */
import { create } from "zustand";
import type { MotivoApoyo } from "../runtime/ejecutor";
import { guardarPreferenciasPekito, leerPreferenciasPekito, type LadoPekito } from "./pekito-preferencias";

/** Lanzador «Por texto o por voz», conversación escrita o llamada de voz. */
export type VistaPekito = "lanzador" | "chat" | "llamada";

interface DatosUIPekito {
  abierto: boolean;
  vista: VistaPekito;
  bienvenidaAbierta: boolean;
  lado: LadoPekito;
  /** Texto del compositor: los chips y abrirPekito() lo prellenan; nunca se envía solo. */
  borrador: string;
  /** Contador que pide enfocar el compositor (cambia en cada petición). */
  pedidoEnfoque: number;
  /** Última ayuda humana que pidió mostrar el asistente (se muestra dentro del chat). */
  apoyo: MotivoApoyo | null;
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
  marcarMensajeVisto(id: string | null): void;
  marcarAvisoVisto(id: string | null): void;
  mostrarApoyo(motivo: MotivoApoyo): void;
  /** Tras «Borrar conversación»: vuelve al lanzador sin borrador ni ayuda mostrada. */
  reiniciarConversacion(): void;
}

export type EstadoUIPekito = DatosUIPekito & AccionesUIPekito;

export const usePekitoUI = create<EstadoUIPekito>()((set) => ({
  abierto: false,
  vista: "lanzador",
  bienvenidaAbierta: false,
  lado: leerPreferenciasPekito().lado,
  borrador: "",
  pedidoEnfoque: 0,
  apoyo: null,
  mensajeVisto: null,
  avisoVisto: null,

  abrir: (vista) => set((estado) => ({ abierto: true, bienvenidaAbierta: false, vista: vista ?? estado.vista })),
  cerrar: () => set({ abierto: false }),
  cambiarVista: (vista) => set({ vista }),
  abrirBienvenida: () => set({ bienvenidaAbierta: true, abierto: false }),
  cerrarBienvenida: () => set({ bienvenidaAbierta: false }),
  moverA: (lado) => {
    guardarPreferenciasPekito({ lado });
    set({ lado });
  },
  cambiarBorrador: (borrador) => set({ borrador }),
  prellenar: (texto) => set((estado) => ({ borrador: texto, pedidoEnfoque: estado.pedidoEnfoque + 1 })),
  marcarMensajeVisto: (mensajeVisto) => set({ mensajeVisto }),
  marcarAvisoVisto: (avisoVisto) => set({ avisoVisto }),
  mostrarApoyo: (apoyo) => set({ apoyo, abierto: true, vista: "chat" }),
  reiniciarConversacion: () => set({ vista: "lanzador", borrador: "", apoyo: null, mensajeVisto: null, avisoVisto: null }),
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
