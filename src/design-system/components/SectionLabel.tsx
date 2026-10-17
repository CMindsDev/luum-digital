import type { HTMLAttributes } from "react";
import { cx } from "../lib/cx";

export interface SectionLabelProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Nivel semántico del encabezado; por omisión h2. Usa "p" si no debe ser encabezado. */
  as?: "h2" | "h3" | "h4" | "p";
}

/** Rótulo de sección en IBM Plex Mono Medium, mayúsculas y tracking 0.05em, como «ACCESOS RÁPIDOS» del Laboratorio. */
export function SectionLabel({ as: Elemento = "h2", className, ...resto }: SectionLabelProps) {
  // tinta-suave sobre fondo 6.47:1 (12 px: el rótulo nunca baja de ese tamaño)
  return (
    <Elemento
      className={cx("font-mono-rotulo text-xs leading-snug font-medium tracking-[0.08em] text-tinta-suave uppercase", className)}
      {...resto}
    />
  );
}
