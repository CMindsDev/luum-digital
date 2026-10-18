import { useEffect, useState } from "react";
import type { ExpertoAsistente } from "@shared/asistente/expertos";
import { DURACION_MORPH_MS } from "./expertos";
import { useMediaQuery } from "./useMediaQuery";

export function useTransicionExperto(experto: ExpertoAsistente): boolean {
  const reducido = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [estado, setEstado] = useState({ experto, cambiando: false });
  if (estado.experto !== experto) setEstado({ experto, cambiando: true });

  useEffect(() => {
    if (!estado.cambiando) return;
    const temporizador = setTimeout(() => setEstado({ experto, cambiando: false }), DURACION_MORPH_MS);
    return () => clearTimeout(temporizador);
  }, [experto, estado.cambiando]);

  return estado.cambiando && !reducido;
}
