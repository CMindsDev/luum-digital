import type { CategoriaReporte, Reporte } from "@/types";
import { NOMBRE_CATEGORIA_REPORTE } from "./reportes";

/**
 * Prioridad sugerida de atención (demostración), con criterios EXPLÍCITOS y explicables:
 * riesgo declarado, antigüedad y tipo de incidente.
 *
 * Por diseño, la función sólo recibe el propio reporte: NUNCA usa la cantidad de reportes de la zona,
 * la popularidad ni los puntos de nadie (AGENTS.md §2.8).
 */

export type NivelPrioridad = "alta" | "media" | "baja";

export interface CriterioPrioridad {
  id: "riesgo_declarado" | "antiguedad" | "tipo";
  descripcion: string;
  peso: number;
}

export interface PrioridadCalculada {
  nivel: NivelPrioridad;
  puntaje: number;
  criterios: CriterioPrioridad[];
  aviso: string;
}

/** Tipos con riesgo vial o sanitario inmediato (criterio de demostración, configurable). */
export const PESO_POR_TIPO: Record<CategoriaReporte, number> = {
  bache: 1,
  desazolve_rejilla: 1,
  animal_muerto: 1,
  luminaria: 1,
  basura_via_publica: 0,
  recoleccion_basura: 0,
  parques_jardines: 0,
};

export const AVISO_PRIORIDAD =
  "Prioridad sugerida para la demostración con criterios explícitos. No depende de cuántas personas reportan ni de puntos.";

export function calcularPrioridad(
  reporte: Pick<Reporte, "categoria" | "riesgoDeclarado" | "creadoEn">,
  ahora: Date,
): PrioridadCalculada {
  const criterios: CriterioPrioridad[] = [];
  if (reporte.riesgoDeclarado) {
    criterios.push({ id: "riesgo_declarado", descripcion: "La persona declaró un riesgo para quienes transitan.", peso: 3 });
  }
  const dias = Math.floor((ahora.getTime() - new Date(reporte.creadoEn).getTime()) / 86_400_000);
  if (dias >= 7) {
    criterios.push({ id: "antiguedad", descripcion: `Lleva ${dias} días sin cerrarse.`, peso: 2 });
  } else if (dias >= 3) {
    criterios.push({ id: "antiguedad", descripcion: `Lleva ${dias} días sin cerrarse.`, peso: 1 });
  }
  const pesoTipo = PESO_POR_TIPO[reporte.categoria];
  if (pesoTipo > 0) {
    criterios.push({
      id: "tipo",
      descripcion: `${NOMBRE_CATEGORIA_REPORTE[reporte.categoria]}: puede afectar la seguridad vial o sanitaria.`,
      peso: pesoTipo,
    });
  }
  const puntaje = criterios.reduce((suma, c) => suma + c.peso, 0);
  const nivel: NivelPrioridad = puntaje >= 4 ? "alta" : puntaje >= 2 ? "media" : "baja";
  return { nivel, puntaje, criterios, aviso: AVISO_PRIORIDAD };
}
