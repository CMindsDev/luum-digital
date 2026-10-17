import { useEffect } from "react";
import { esDobleEscape, salirRapido } from "../lib/salida-rapida";

/**
 * Escape dos veces seguidas activa la salida rápida. Se escucha en fase de captura en window para
 * que funcione aunque haya un diálogo abierto (el primer Escape lo cierra y cuenta igual).
 */
export function useSalidaRapidaConEscape(salir: () => void = salirRapido) {
  useEffect(() => {
    let anterior: number | null = null;
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key !== "Escape" || evento.repeat) return;
      const ahora = performance.now();
      if (esDobleEscape(anterior, ahora)) {
        anterior = null;
        salir();
        return;
      }
      anterior = ahora;
    };
    window.addEventListener("keydown", alTeclear, true);
    return () => window.removeEventListener("keydown", alTeclear, true);
  }, [salir]);
}
