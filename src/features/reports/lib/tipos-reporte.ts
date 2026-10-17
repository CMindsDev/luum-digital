import { CATEGORIAS_REPORTE, NOMBRE_CATEGORIA_REPORTE } from "@/domain/reportes";
import type { CategoriaReporte } from "@/types";

/**
 * Textos del hub de reportes con los nombres de Mérida Móvil v4.0.2 (consulta 2026-10-17):
 * «Reportes rápidos» (Bache a la vista, Desazolve de rejilla, Basura en vía pública),
 * «Catálogo de reportes» y «Mis reportes».
 */

export interface ReporteRapido {
  categoria: CategoriaReporte;
  nombre: string;
  descripcion: string;
  /** data-guia estable (el asistente señala «reportes.bache_a_la_vista»). */
  guia: string;
}

export const REPORTES_RAPIDOS: readonly ReporteRapido[] = [
  {
    categoria: "bache",
    nombre: "Bache a la vista",
    descripcion: "Hoyos o pavimento dañado en la calle.",
    guia: "reportes.bache_a_la_vista",
  },
  {
    categoria: "desazolve_rejilla",
    nombre: "Desazolve de rejilla",
    descripcion: "Rejillas pluviales tapadas o con basura.",
    guia: "reportes.desazolve_de_rejilla",
  },
  {
    categoria: "basura_via_publica",
    nombre: "Basura en vía pública",
    descripcion: "Basura o cacharros en calles y banquetas.",
    guia: "reportes.basura_en_via_publica",
  },
];

/** Descripción breve de cada tipo en «Catálogo de reportes» («Elige el tipo de atención que necesitas»). */
export const DESCRIPCION_CATEGORIA: Record<CategoriaReporte, string> = {
  bache: "Hoyos, hundimientos o pavimento roto.",
  luminaria: "Luminarias apagadas, que parpadean o dañadas.",
  desazolve_rejilla: "Rejillas o coladeras tapadas que encharcan la calle.",
  basura_via_publica: "Basura, escombro o cacharros abandonados.",
  animal_muerto: "Animales sin vida en calles o banquetas.",
  parques_jardines: "Maleza, hojas o limpieza pendiente en parques.",
  recoleccion_basura: "El camión de la basura no pasó el día que corresponde.",
};

export const TIPOS_REPORTE = CATEGORIAS_REPORTE;

/** Título de la pantalla de nuevo reporte: el nombre del reporte rápido si existe. */
export function tituloNuevoReporte(categoria: CategoriaReporte): { titulo: string; rapido: boolean } {
  const rapido = REPORTES_RAPIDOS.find((r) => r.categoria === categoria);
  return rapido ? { titulo: rapido.nombre, rapido: true } : { titulo: NOMBRE_CATEGORIA_REPORTE[categoria], rapido: false };
}
