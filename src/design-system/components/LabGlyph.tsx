import type { SVGProps } from "react";
import { GlifoPixel } from "./GlifoPixel";

export interface LabGlyphProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /** Tamaño en px o cualquier unidad CSS. Por omisión 1em (sigue al texto). */
  tamano?: number | string;
}

/*
 * Glifo de asterisco pixelado del Laboratorio de Innovación. Es el mismo que GlifoPixel (trazos
 * exactos del Figma, 22:953); se conserva este nombre por compatibilidad con los módulos que ya lo
 * usan. Decorativo (aria-hidden) y NUNCA sustituye al logotipo del Ayuntamiento. Toma `currentColor`.
 */
export function LabGlyph(props: LabGlyphProps) {
  return <GlifoPixel {...props} />;
}
