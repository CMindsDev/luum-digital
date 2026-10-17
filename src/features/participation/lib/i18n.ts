import { msg } from "@/i18n";
import type { CategoriaReporte } from "@/types";

export const NOMBRE_CATEGORIA_REPORTE_PARTICIPACION_UI: Record<CategoriaReporte, string> = {
  bache: msg("Bache"),
  luminaria: msg("Luminaria"),
  desazolve_rejilla: msg("Desazolve de rejilla"),
  basura_via_publica: msg("Basura en vía pública"),
  animal_muerto: msg("Animal muerto"),
  parques_jardines: msg("Limpieza de parques y jardines"),
  recoleccion_basura: msg("Queja por falta de recolección de basura"),
};
