import { msg } from "@/i18n";
import type { CategoriaReporte, EstadoMunicipal, UbicacionServicio } from "@/types";

export const NOMBRE_CATEGORIA_REPORTE_MAPA_UI: Record<CategoriaReporte, string> = {
  bache: msg("Bache"),
  luminaria: msg("Luminaria"),
  desazolve_rejilla: msg("Desazolve de rejilla"),
  basura_via_publica: msg("Basura en vía pública"),
  animal_muerto: msg("Animal muerto"),
  parques_jardines: msg("Limpieza de parques y jardines"),
  recoleccion_basura: msg("Queja por falta de recolección de basura"),
};

export const ETIQUETA_ESTADO_MUNICIPAL_MAPA_UI: Record<EstadoMunicipal, string> = {
  registrado: msg("Registrado"),
  en_proceso: msg("En proceso de atención"),
  solucionado: msg("Solucionado"),
  cancelado: msg("Cancelado"),
};

export const ETIQUETA_TIPO_UBICACION_ATENCION_UI: Record<UbicacionServicio["tipo"], string> = {
  salud_mental: msg("Atención psicológica"),
  salud: msg("Salud"),
  mujeres: msg("Atención a mujeres"),
  atencion_ciudadana: msg("Atención ciudadana"),
  deporte: msg("Deporte"),
  educacion: msg("Educación"),
};
