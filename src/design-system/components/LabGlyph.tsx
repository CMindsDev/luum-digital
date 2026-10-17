import type { SVGProps } from "react";

export interface LabGlyphProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /** Tamaño en px o cualquier unidad CSS. Por omisión 1em (sigue al texto). */
  tamano?: number | string;
}

/*
 * Glifo de asterisco pixelado del Laboratorio de Innovación (8 rayos de bloques), recreado en
 * una cuadrícula de 9 × 9: barras vertical y horizontal, bloque central de 3 × 3 y rayos
 * diagonales de dos bloques. Es decorativo (aria-hidden) y NUNCA sustituye al logotipo del
 * Ayuntamiento. Toma el color de `currentColor`.
 */
const BLOQUES_DIAGONALES: ReadonlyArray<readonly [number, number]> = [
  [1, 1],
  [2, 2],
  [7, 1],
  [6, 2],
  [1, 7],
  [2, 6],
  [7, 7],
  [6, 6],
];

export function LabGlyph({ tamano = "1em", className, ...resto }: LabGlyphProps) {
  return (
    <svg
      viewBox="0 0 9 9"
      width={tamano}
      height={tamano}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...resto}
    >
      <rect x="4" y="0" width="1" height="9" rx="0.16" />
      <rect x="0" y="4" width="9" height="1" rx="0.16" />
      <rect x="3" y="3" width="3" height="3" rx="0.2" />
      {BLOQUES_DIAGONALES.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x + 0.04} y={y + 0.04} width="0.92" height="0.92" rx="0.14" />
      ))}
    </svg>
  );
}
