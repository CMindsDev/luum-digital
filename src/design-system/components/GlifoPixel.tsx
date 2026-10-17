import type { SVGProps } from "react";
import { ALTO_GLIFO_PIXEL, ANCHO_GLIFO_PIXEL, TRAZOS_GLIFO_PIXEL } from "../lib/glifo-pixel-trazos";

export interface GlifoPixelProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /** Tamaño en px o cualquier unidad CSS. Por omisión 1em (sigue al texto). */
  tamano?: number | string;
}

/**
 * Asterisco pixelado de los mosaicos del Laboratorio de Innovación (Figma 22:953): los trazos exactos
 * del tablero, que toman `currentColor`. Es decorativo (aria-hidden) y NUNCA sustituye al logotipo del
 * Ayuntamiento ni nombra por sí solo nada: la etiqueta de texto va siempre junto a él.
 */
export function GlifoPixel({ tamano = "1em", className, ...resto }: GlifoPixelProps) {
  return (
    <svg
      viewBox={`0 0 ${ANCHO_GLIFO_PIXEL} ${ALTO_GLIFO_PIXEL}`}
      width={tamano}
      height={tamano}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...resto}
    >
      {TRAZOS_GLIFO_PIXEL.map((trazo) => (
        <path key={trazo} d={trazo} />
      ))}
    </svg>
  );
}
