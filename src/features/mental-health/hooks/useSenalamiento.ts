import { useEffect } from "react";
import { suscribirActuacion } from "@/features/assistant/runtime";

const DURACION_RESALTADO_MS = 2600;

function prefiereMovimientoReducido(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Cuando el acompañante señala un control de esta pantalla (senalarElemento → evento «point» del bus
 * de actuación), lo desplaza a la vista y lo resalta un momento con `data-senalado`. Nunca hace clic
 * ni cambia el foco. Sólo atiende ids con el prefijo dado (p. ej. "salud_mental.").
 */
export function useSenalamiento(prefijo: string) {
  useEffect(() => {
    const temporizadores = new Set<number>();
    const dejar = suscribirActuacion((evento) => {
      if (evento.tipo !== "point" || !evento.objetivo.startsWith(prefijo)) return;
      const elemento = Array.from(document.querySelectorAll<HTMLElement>("[data-guia]")).find((candidato) => candidato.dataset.guia === evento.objetivo);
      if (!elemento) return;
      elemento.scrollIntoView?.({ block: "start", behavior: prefiereMovimientoReducido() ? "auto" : "smooth" });
      elemento.setAttribute("data-senalado", "true");
      const temporizador = window.setTimeout(() => {
        elemento.removeAttribute("data-senalado");
        temporizadores.delete(temporizador);
      }, DURACION_RESALTADO_MS);
      temporizadores.add(temporizador);
    });
    return () => {
      dejar();
      for (const temporizador of temporizadores) window.clearTimeout(temporizador);
    };
  }, [prefijo]);
}
