/**
 * Espacios donde Pekito NUNCA aparece: salud mental y Línea Mujer tienen su propia barra de ayuda
 * humana, su conversación aislada y no deben mezclarse con el asistente general (incluye subrutas).
 */
const RUTAS_SIN_PEKITO = [/^\/bienestar\/salud-mental(?:\/|$)/, /^\/bienestar\/linea-mujer(?:\/|$)/] as const;

export function esRutaSinPekito(pathname: string): boolean {
  const ruta = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return RUTAS_SIN_PEKITO.some((patron) => patron.test(ruta));
}
