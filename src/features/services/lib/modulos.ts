/** Nombre visible del módulo interno al que apunta una ruta del prototipo. */
const MODULOS: ReadonlyArray<readonly [string, string]> = [
  ["/bienestar/salud-mental", "Salud mental"],
  ["/bienestar/linea-mujer", "Línea Mujer"],
  ["/bienestar", "Bienestar"],
  ["/reportes", "Reportes"],
  ["/mapa", "Mapa / Visor Urbano"],
  ["/expediente", "Mi expediente"],
  ["/participacion", "Participación y recompensas"],
  ["/gestiones", "Mis gestiones"],
];

export function nombreModulo(ruta: string): string {
  return MODULOS.find(([prefijo]) => ruta === prefijo || ruta.startsWith(`${prefijo}/`))?.[1] ?? "la app";
}

/** true si la ruta interna del servicio vive en otro módulo (no en el catálogo). */
export function rutaEnOtroModulo(rutaInterna: string): boolean {
  return rutaInterna.startsWith("/") && !rutaInterna.startsWith("/servicios");
}
