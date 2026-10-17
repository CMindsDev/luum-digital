/**
 * Colores de las capas del mapa tomados de los tokens del design system (src/design-system/tokens.css).
 * El motor del mapa pinta en WebGL y necesita valores de color reales: se leen de las variables CSS
 * `--color-*` en tiempo de ejecución, así no se escriben colores sueltos en los componentes.
 */

export const TOKENS_MAPA = [
  "marino",
  "azul",
  "azul-suave",
  "ambar",
  "ambar-suave",
  "cafe",
  "magenta",
  "magenta-fuerte",
  "lima",
  "lima-logo",
  "lima-suave",
  "superficie",
  "superficie-2",
  "tinta",
  "estado-registrado",
  "estado-registrado-tinta",
  "estado-proceso",
  "estado-solucionado",
  "estado-cancelado",
] as const;

export type TokenMapa = (typeof TOKENS_MAPA)[number];

export type ColoresMapa = Record<TokenMapa, string>;

/** Respaldo neutro si una variable no está disponible (p. ej. en pruebas sin CSS). */
const RESPALDO = "gray";

/** Lee los colores de los tokens. Sin documento (pruebas en Node), devuelve el respaldo neutro. */
export function leerColoresMapa(raiz: Element | null = typeof document === "undefined" ? null : document.documentElement): ColoresMapa {
  const estilo = raiz && typeof getComputedStyle === "function" ? getComputedStyle(raiz) : null;
  const colores = {} as ColoresMapa;
  for (const token of TOKENS_MAPA) {
    const valor = estilo?.getPropertyValue(`--color-${token}`).trim();
    colores[token] = valor ? valor : RESPALDO;
  }
  return colores;
}
