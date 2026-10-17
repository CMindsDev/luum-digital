import { ChevronDown, ChevronsUp, ChevronUp, type LucideIcon } from "lucide-react";
import type { TonoInsignia } from "@/design-system";
import { calcularPrioridad, type NivelPrioridad, type PrioridadCalculada } from "@/domain/prioridad";
import type { EstadoMunicipal, FiltroReportes, Reporte } from "@/types";

/**
 * Cola de atención del operador de demostración. El orden usa SÓLO la prioridad sugerida con
 * criterios explícitos (riesgo declarado, antigüedad y tipo; src/domain/prioridad.ts) y, a igual
 * prioridad, el reporte más antiguo primero. Nunca usa popularidad, aportaciones, verificaciones
 * ni puntos (AGENTS.md §2.8).
 */

export const ESTADOS_EN_COLA: readonly EstadoMunicipal[] = ["registrado", "en_proceso"];

/** Filtro estable de la consulta de la cola (forma parte de la clave de TanStack Query). */
export const FILTRO_COLA: FiltroReportes = { estados: [...ESTADOS_EN_COLA] };

export interface ElementoCola {
  reporte: Reporte;
  prioridad: PrioridadCalculada;
}

export function ordenarCola(reportes: readonly Reporte[], ahora: Date): ElementoCola[] {
  return reportes
    .filter((reporte) => ESTADOS_EN_COLA.includes(reporte.estadoMunicipal))
    .map((reporte) => ({ reporte, prioridad: calcularPrioridad(reporte, ahora) }))
    .sort(
      (a, b) =>
        b.prioridad.puntaje - a.prioridad.puntaje ||
        (a.reporte.creadoEn < b.reporte.creadoEn ? -1 : a.reporte.creadoEn > b.reporte.creadoEn ? 1 : 0) ||
        a.reporte.folio.localeCompare(b.reporte.folio),
    );
}

export const ETIQUETA_NIVEL: Record<NivelPrioridad, string> = {
  alta: "Prioridad alta",
  media: "Prioridad media",
  baja: "Prioridad baja",
};

export const ICONO_NIVEL: Record<NivelPrioridad, LucideIcon> = {
  alta: ChevronsUp,
  media: ChevronUp,
  baja: ChevronDown,
};

export const TONO_NIVEL: Record<NivelPrioridad, TonoInsignia> = {
  alta: "peligro",
  media: "aviso",
  baja: "neutro",
};
