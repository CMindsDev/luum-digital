import { msg } from "@/i18n";
import type { Rol } from "@/types";

/** Nombre visible de cada rol de demostración. */
export const ETIQUETA_ROL: Record<Rol, string> = {
  ciudadania: msg("Ciudadanía"),
  operador: msg("Operación"),
  administracion: msg("Administración"),
};
