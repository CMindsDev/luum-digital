import { t } from "i18next";
import { msg } from "@/i18n";

/** Nombre visible del módulo interno al que apunta una ruta del prototipo. */
const MODULOS: ReadonlyArray<readonly [string, string]> = [
  ["/bienestar/salud-mental", msg("Salud mental")],
  ["/bienestar/linea-mujer", msg("Línea Mujer")],
  ["/bienestar", msg("Bienestar")],
  ["/reportes", msg("Reportes")],
  ["/mapa", msg("Mapa / Visor Urbano")],
  ["/expediente", msg("Mi expediente")],
  ["/participacion", msg("Participación y recompensas")],
  ["/gestiones", msg("Mis gestiones")],
];

export function nombreModulo(ruta: string): string {
  return t(MODULOS.find(([prefijo]) => ruta === prefijo || ruta.startsWith(`${prefijo}/`))?.[1] ?? msg("la app"));
}

/** true si la ruta interna del servicio vive en otro módulo (no en el catálogo). */
export function rutaEnOtroModulo(rutaInterna: string): boolean {
  return rutaInterna.startsWith("/") && !rutaInterna.startsWith("/servicios");
}
