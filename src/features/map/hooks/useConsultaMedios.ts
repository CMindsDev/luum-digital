import { useSyncExternalStore } from "react";

/** true si la consulta de medios se cumple (p. ej. "(min-width: 64rem)"). Sin matchMedia, false. */
export function useConsultaMedios(consulta: string): boolean {
  return useSyncExternalStore(
    (aviso) => {
      if (typeof window.matchMedia !== "function") return () => undefined;
      const lista = window.matchMedia(consulta);
      lista.addEventListener("change", aviso);
      return () => lista.removeEventListener("change", aviso);
    },
    () => typeof window.matchMedia === "function" && window.matchMedia(consulta).matches,
    () => false,
  );
}
