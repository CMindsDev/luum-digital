import { Construction, Grid3x3, Lightbulb, PawPrint, Trash2, Trees, Truck, type LucideIcon } from "lucide-react";
import type { TonoMosaico } from "@/design-system";
import type { CategoriaReporte, Ubicacion } from "@/types";

/**
 * Presentación compartida de los tipos de reporte (ícono de contorno y tono del Laboratorio).
 * Los nombres vienen de src/domain/reportes.ts (NOMBRE_CATEGORIA_REPORTE, nombres de Mérida Móvil).
 */
export const ICONO_CATEGORIA_REPORTE: Record<CategoriaReporte, LucideIcon> = {
  bache: Construction,
  luminaria: Lightbulb,
  desazolve_rejilla: Grid3x3,
  basura_via_publica: Trash2,
  animal_muerto: PawPrint,
  parques_jardines: Trees,
  recoleccion_basura: Truck,
};

/** Tono de mosaico por tipo (movilidad en ámbar, agua en azul, medio ambiente en lima…). */
export const TONO_CATEGORIA_REPORTE: Record<CategoriaReporte, TonoMosaico> = {
  bache: "ambar",
  luminaria: "marino",
  desazolve_rejilla: "azul",
  basura_via_publica: "lima",
  animal_muerto: "cafe",
  parques_jardines: "lima",
  recoleccion_basura: "magenta",
};

/** Contenedor suave del ícono (fondo claro del tono + ícono marino o café, ≥ 3:1). */
export const CLASES_ICONO_CATEGORIA: Record<TonoMosaico, string> = {
  azul: "bg-azul-suave text-azul",
  ambar: "bg-ambar-suave text-cafe",
  cafe: "bg-cafe-suave text-cafe",
  magenta: "bg-magenta-suave text-magenta-tinta",
  lima: "bg-lima-suave text-cafe",
  marino: "bg-marino-suave text-marino",
};

/** Cómo se obtuvo la ubicación, en palabras. */
export const ETIQUETA_ORIGEN_UBICACION: Record<Ubicacion["origen"], string> = {
  manual: "Escrita a mano (ubicación aproximada: centro de la colonia)",
  mapa: "Marcada en el mapa",
  dispositivo: "Ubicación del dispositivo",
};

/** «Calle 60 x 59 y 61 · Centro». */
export function describirUbicacionCorta(ubicacion: Pick<Ubicacion, "referencia" | "colonia">): string {
  return ubicacion.colonia ? `${ubicacion.referencia} · ${ubicacion.colonia}` : ubicacion.referencia;
}
