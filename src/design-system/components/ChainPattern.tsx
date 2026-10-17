import { useId, type SVGProps } from "react";

export interface ChainPatternProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /** Alto en px o unidad CSS; el ancho se ajusta (proporción 3:1). */
  alto?: number | string;
}

/*
 * Patrón de cadena del banner del Laboratorio: flor de puntos, cruz con ojo circular y cruz
 * escalonada con ojo cuadrado, unidas por eslabones. Decorativo (aria-hidden), `currentColor`.
 */
const PETALOS = Array.from({ length: 8 }, (_, indice) => {
  const angulo = (indice * Math.PI) / 4;
  return { cx: 14 + Math.cos(angulo) * 7.2, cy: 20 + Math.sin(angulo) * 7.2 };
});

export function ChainPattern({ alto = 40, className, ...resto }: ChainPatternProps) {
  const id = useId().replace(/:/g, "");
  const mascara = `cadena-${id}`;
  return (
    <svg
      viewBox="0 0 120 40"
      height={alto}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ aspectRatio: "3 / 1", width: "auto" }}
      {...resto}
    >
      <defs>
        <mask id={mascara}>
          <rect width="120" height="40" fill="white" />
          <circle cx="50" cy="20" r="3.4" fill="black" />
          <rect x="87.6" y="16.6" width="6.8" height="6.8" fill="black" />
        </mask>
      </defs>
      {PETALOS.map(({ cx, cy }) => (
        <circle key={`${cx.toFixed(2)}-${cy.toFixed(2)}`} cx={cx} cy={cy} r="3.1" />
      ))}
      <circle cx="26" cy="20" r="2.6" />
      <rect x="27" y="18.2" width="12" height="3.6" rx="1.8" />
      <g mask={`url(#${mascara})`}>
        <rect x="40" y="12" width="20" height="16" rx="4" />
        <rect x="44" y="8" width="12" height="24" rx="4" />
        <rect x="47" y="4" width="6" height="32" rx="3" />
        <rect x="59" y="18" width="16" height="4" rx="2" />
        <rect x="80" y="12" width="22" height="16" rx="1.2" />
        <rect x="84" y="8" width="14" height="24" rx="1.2" />
        <rect x="87.5" y="3.5" width="7" height="33" rx="1.2" />
        <rect x="76" y="16.5" width="30" height="7" rx="1.2" />
      </g>
    </svg>
  );
}
