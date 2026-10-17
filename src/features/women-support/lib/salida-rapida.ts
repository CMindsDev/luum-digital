/**
 * Salida rápida de Línea Mujer: reemplaza esta pestaña por una página neutral con location.replace
 * (la página actual no queda como «siguiente» en el historial). No borra el historial del
 * navegador ni garantiza ocultar la actividad: la interfaz lo explica.
 */

/** Página neutral y genérica (buscador). No lleva texto de la persona en la URL. */
export const DESTINO_SALIDA_RAPIDA = "https://www.google.com/";

/** Dos pulsaciones de Escape dentro de esta ventana activan la salida rápida. */
export const VENTANA_DOBLE_ESCAPE_MS = 1000;

/** true si la pulsación actual de Escape completa un doble Escape. */
export function esDobleEscape(anterior: number | null, ahora: number, ventanaMs: number = VENTANA_DOBLE_ESCAPE_MS): boolean {
  return anterior !== null && ahora - anterior >= 0 && ahora - anterior <= ventanaMs;
}

/** Sale de inmediato hacia la página neutral. `reemplazar` se inyecta en pruebas. */
export function salirRapido(reemplazar: (url: string) => void = (url) => window.location.replace(url)): void {
  reemplazar(DESTINO_SALIDA_RAPIDA);
}
