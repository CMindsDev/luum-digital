import type { AreaBienestar } from "@/types";
import type { TonoInsignia } from "@/design-system";
import { msg } from "@/i18n";

/** Nombres visibles de las áreas de bienestar. */
export const ETIQUETA_AREA: Readonly<Record<AreaBienestar, string>> = {
  salud: msg("Salud"),
  salud_mental: msg("Salud mental"),
  educacion: msg("Educación"),
  deporte: msg("Deporte"),
  mujeres: msg("Mujeres"),
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
