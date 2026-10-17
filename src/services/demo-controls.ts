import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { almacenamientoSeguro } from "@/utils/almacenamiento";

/**
 * Controles de la demostración (se ajustan en /cuenta). Los adaptadores demo los leen para
 * simular latencia, falta de conexión y errores, de modo que cada pantalla muestre sus estados.
 */
export type RepositorioConError =
  | "ninguno"
  | "catalog"
  | "procedures"
  | "reports"
  | "verifications"
  | "rewards"
  | "digitalFile"
  | "wellbeing"
  | "notifications";

interface DemoControlsState {
  /** Simula falta de conexión (además de navigator.onLine). */
  simularSinConexion: boolean;
  /** Latencia artificial de los adaptadores demo, en milisegundos. */
  latenciaMs: number;
  /** Fuerza error en un repositorio para revisar el estado de error. */
  forzarErrorEn: RepositorioConError;
  establecer: (cambios: Partial<Pick<DemoControlsState, "simularSinConexion" | "latenciaMs" | "forzarErrorEn">>) => void;
}

export const useDemoControls = create<DemoControlsState>()(
  persist(
    (set) => ({
      simularSinConexion: false,
      latenciaMs: 250,
      forzarErrorEn: "ninguno",
      establecer: (cambios) => set(cambios),
    }),
    {
      name: "merida-demo:v1:controles",
      storage: createJSONStorage(() => almacenamientoSeguro()),
      partialize: (state) => ({ simularSinConexion: state.simularSinConexion, latenciaMs: state.latenciaMs }),
    },
  ),
);

/** Lectura fuera de React (adaptadores). */
export function leerControlesDemo() {
  const { simularSinConexion, latenciaMs, forzarErrorEn } = useDemoControls.getState();
  const sinRed = typeof navigator !== "undefined" && navigator.onLine === false;
  return { sinConexion: simularSinConexion || sinRed, latenciaMs, forzarErrorEn };
}
