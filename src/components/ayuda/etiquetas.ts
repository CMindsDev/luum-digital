import type { AreaBienestar } from "@/types";
import type { TonoInsignia } from "@/design-system";

/** Nombres visibles de las áreas de bienestar. */
export const ETIQUETA_AREA: Readonly<Record<AreaBienestar, string>> = {
  salud: "Salud",
  salud_mental: "Salud mental",
  educacion: "Educación",
  deporte: "Deporte",
  mujeres: "Mujeres",
};

/** Tono de la insignia de área (siempre con texto; el color nunca es el único indicador). */
export const TONO_AREA: Readonly<Record<AreaBienestar, TonoInsignia>> = {
  salud: "azul",
  salud_mental: "info",
  educacion: "ambar",
  deporte: "lima",
  mujeres: "magenta",
};

export const ORDEN_AREAS: readonly AreaBienestar[] = ["salud", "salud_mental", "educacion", "deporte", "mujeres"];
