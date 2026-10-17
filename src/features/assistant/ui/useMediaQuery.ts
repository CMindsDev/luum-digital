import { useSyncExternalStore } from "react";

/** Desde este ancho el panel de Pekito es una tarjeta no modal junto a la mascota; debajo, pantalla completa. */
export const CONSULTA_TARJETA = "(min-width: 800px)";

/** Suscribe un componente a una media query (p. ej. «(min-width: 800px)»). Sin matchMedia, false. */
export function useMediaQuery(consulta: string): boolean {
  return useSyncExternalStore(
    (alCambiar) => {
      const lista = window.matchMedia?.(consulta);
      lista?.addEventListener("change", alCambiar);
      return () => lista?.removeEventListener("change", alCambiar);
    },
    () => window.matchMedia?.(consulta).matches ?? false,
    () => false,
  );
}
