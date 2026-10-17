import { create } from "zustand";

export type TonoAviso = "info" | "exito" | "aviso" | "error";

export interface AccionAviso {
  etiqueta: string;
  alActivar: () => void;
}

export interface AvisoEmergente {
  id: string;
  tono: TonoAviso;
  titulo: string;
  descripcion?: string;
  accion?: AccionAviso;
  /** Milisegundos antes de ocultarse; null = hasta que la persona lo cierre. */
  duracionMs: number | null;
}

export type NuevoAviso = Omit<AvisoEmergente, "id" | "duracionMs"> & { duracionMs?: number | null };

interface EstadoAvisos {
  avisos: AvisoEmergente[];
  agregar: (aviso: AvisoEmergente) => void;
  descartar: (id: string) => void;
  limpiar: () => void;
}

const MAXIMO_VISIBLES = 3;

/** Estado de interfaz de los avisos emergentes (Toaster). */
export const useAvisos = create<EstadoAvisos>()((set) => ({
  avisos: [],
  agregar: (aviso) => set((estado) => ({ avisos: [...estado.avisos, aviso].slice(-MAXIMO_VISIBLES) })),
  descartar: (id) => set((estado) => ({ avisos: estado.avisos.filter((aviso) => aviso.id !== id) })),
  limpiar: () => set({ avisos: [] }),
}));

let contador = 0;

/**
 * Muestra un aviso emergente en la región aria-live del AppShell.
 * Los avisos con acción o de error no se ocultan solos (WCAG 2.2.1).
 */
export function notificar(aviso: NuevoAviso): string {
  contador += 1;
  const id = `aviso-${Date.now().toString(36)}-${contador}`;
  const duracionPredeterminada = aviso.accion || aviso.tono === "error" ? null : 6000;
  useAvisos.getState().agregar({
    ...aviso,
    id,
    duracionMs: aviso.duracionMs === undefined ? duracionPredeterminada : aviso.duracionMs,
  });
  return id;
}

export function descartarAviso(id: string): void {
  useAvisos.getState().descartar(id);
}
