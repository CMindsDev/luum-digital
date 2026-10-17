import { cx } from "../lib/cx";

export interface BrandLogoProps {
  /** horizontal: para fondo marino (encabezado). vertical: a color para fondos claros. */
  variante?: "horizontal" | "vertical";
  className?: string;
}

/**
 * Logotipo oficial del Ayuntamiento de Mérida 2024-2027 (archivos de public/brand/, obtenidos del
 * portal municipal). No se recolorea ni se combina con otra marca.
 */
export function BrandLogo({ variante = "horizontal", className }: BrandLogoProps) {
  const horizontal = variante === "horizontal";
  return (
    <img
      src={horizontal ? "/brand/ayuntamiento-merida-horizontal.svg" : "/brand/ayuntamiento-merida-vertical.svg"}
      alt="Ayuntamiento de Mérida 2024-2027"
      width={horizontal ? 332 : 500}
      height={horizontal ? 120 : 500}
      decoding="async"
      className={cx(horizontal ? "h-10 w-auto" : "h-24 w-auto", className)}
    />
  );
}
