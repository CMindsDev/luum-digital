/**
 * Familias del Laboratorio (ESPECIFICACION_FIGMA.md §2.1) con respaldo: usan el token del design
 * system si existe (--font-serif-acento, --font-mono-rotulo) y, si no, el nombre de la familia
 * autoalojada y una genérica parecida. Clases completas para que Tailwind las detecte.
 */
export const FUENTE_SERIF_ACENTO = "font-[family-name:var(--font-serif-acento,'Instrument_Serif',Georgia,serif)]";
export const FUENTE_MONO_ROTULO = "font-[family-name:var(--font-mono-rotulo,'IBM_Plex_Mono',ui-monospace,monospace)]";
