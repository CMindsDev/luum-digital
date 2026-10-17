import { msg } from "@/i18n";
import type { CategoriaReporte, EstadoMunicipal, Ubicacion } from "@/types";

export const NOMBRE_CATEGORIA_REPORTE_UI: Record<CategoriaReporte, string> = {
  bache: msg("Bache"),
  luminaria: msg("Luminaria"),
  desazolve_rejilla: msg("Desazolve de rejilla"),
  basura_via_publica: msg("Basura en vía pública"),
  animal_muerto: msg("Animal muerto"),
  parques_jardines: msg("Limpieza de parques y jardines"),
  recoleccion_basura: msg("Queja por falta de recolección de basura"),
};

export const ETIQUETA_ESTADO_MUNICIPAL_UI: Record<EstadoMunicipal, string> = {
  registrado: msg("Registrado"),
  en_proceso: msg("En proceso de atención"),
  solucionado: msg("Solucionado"),
  cancelado: msg("Cancelado"),
};

export const ETIQUETA_FILTRO_ESTADO_MUNICIPAL_UI: Record<EstadoMunicipal, string> = {
  registrado: msg("Registrado"),
  en_proceso: msg("En proceso de atención"),
  solucionado: msg("Solucionado"),
  cancelado: msg("Motivo de cancelación"),
};

export const ETIQUETA_ORIGEN_UBICACION_UI: Record<Ubicacion["origen"], string> = {
  manual: msg("Escrita a mano (ubicación aproximada: centro de la colonia)"),
  mapa: msg("Marcada en el mapa"),
  dispositivo: msg("Ubicación del dispositivo"),
};
