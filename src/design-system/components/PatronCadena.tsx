import type { CSSProperties, SVGProps } from "react";

export interface PatronCadenaProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /** Alto en px o unidad CSS; el ancho se ajusta (proporción 258.3 : 86.8 ≈ 3 : 1). */
  alto?: number | string;
}

/** Silueta horizontal del patrón (el SVG del Figma es vertical y se dibuja girado 90°; ver el archivo). */
const RUTA_PATRON = "/brand/laboratorio/tablero/patron-cadena-horizontal.svg";
const ANCHO = 258.307;
const ALTO = 86.7906;

/**
 * Patrón de cadena pixelada del banner y del cierre del tablero (Figma 22:1026 y 34:1453): flor de
 * puntos, cruz con ojo circular y cruz con ojo cuadrado unidas por eslabones. Son los trazos exactos del
 * Figma (public/brand/laboratorio/tablero/patron-cadena-horizontal.svg) usados como máscara, de modo que
 * toma `currentColor` (crema sobre azul en el banner, azul sobre crema en el cierre). Decorativo
 * (aria-hidden).
 */
export function PatronCadena({ alto = 40, className, style, ...resto }: PatronCadenaProps) {
  const estilo: CSSProperties = {
    height: alto,
    width: "auto",
    aspectRatio: `${ANCHO} / ${ALTO}`,
    backgroundColor: "currentColor",
    WebkitMaskImage: `url(${RUTA_PATRON})`,
    maskImage: `url(${RUTA_PATRON})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
    ...style,
  };
  return (
    <svg
      viewBox={`0 0 ${ANCHO} ${ALTO}`}
      aria-hidden="true"
      focusable="false"
      className={className}
      style={estilo}
      {...resto}
    />
  );
}
