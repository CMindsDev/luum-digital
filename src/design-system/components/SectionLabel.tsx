import type { HTMLAttributes } from "react";
import { cx } from "../lib/cx";

export interface SectionLabelProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Nivel semántico del encabezado; por omisión h2. Usa "p" si no debe ser encabezado. */
  as?: "h2" | "h3" | "h4" | "p";
}

/** Etiqueta de sección en mayúsculas pequeñas, como «ACCESOS RÁPIDOS» de Mérida Móvil. */
export function SectionLabel({ as: Elemento = "h2", className, ...resto }: SectionLabelProps) {
  // tinta-suave sobre fondo 6.47:1
  return (
    <Elemento
      className={cx("text-xs font-semibold tracking-[0.12em] text-tinta-suave uppercase", className)}
      {...resto}
    />
  );
}
