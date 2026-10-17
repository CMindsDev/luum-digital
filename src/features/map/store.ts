import { create } from "zustand";
import type { VistaMapa } from "@/components/mapa/tipos";

/**
 * Estado de interfaz del Visor que no va en la URL: la última posición de la cámara. Vive sólo en
 * memoria (no se persiste) para que, al volver de un detalle, el mapa quede donde estaba.
 */
interface CamaraVisorState {
  vista: VistaMapa | null;
  guardar: (vista: VistaMapa) => void;
}

export const useCamaraVisor = create<CamaraVisorState>()((set) => ({
  vista: null,
  guardar: (vista) => set({ vista }),
}));
