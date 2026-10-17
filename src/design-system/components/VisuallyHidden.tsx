import type { ElementType, HTMLAttributes } from "react";

export interface VisuallyHiddenProps extends HTMLAttributes<HTMLElement> {
  /** Elemento a renderizar (span por omisión). */
  as?: ElementType;
}

/** Texto sólo para lectores de pantalla (clase sr-only de Tailwind). */
export function VisuallyHidden({ as: Elemento = "span", className, ...resto }: VisuallyHiddenProps) {
  return <Elemento className={className ? `sr-only ${className}` : "sr-only"} {...resto} />;
}
