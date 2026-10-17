export type ValorClase = string | false | null | undefined | 0;

/** Une clases de Tailwind ignorando valores vacíos o falsos. */
export function cx(...clases: ValorClase[]): string {
  return clases.filter(Boolean).join(" ");
}
