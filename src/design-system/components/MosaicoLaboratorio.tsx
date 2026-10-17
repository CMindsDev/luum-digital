import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { cx } from "../lib/cx";
import type { TonoMosaico } from "../lib/tonos";
import { GlifoPixel } from "./GlifoPixel";

export interface MosaicoLaboratorioProps {
  /** Etiqueta visible: el mosaico nunca se comunica sólo con color y glifo. */
  etiqueta: string;
  descripcion?: string;
  tono?: TonoMosaico;
  /** debajo (por omisión): mosaico y texto centrados en columna. lado: mosaico a la izquierda del texto. */
  posicionEtiqueta?: "debajo" | "lado";
  /** Lado del cuadrado en px o unidad CSS. Sin valor ocupa el ancho de su columna (1:1). */
  tamano?: number | string;
  /** Ícono de contorno de lucide en lugar del glifo pixelado (por omisión el glifo, como en el tablero). */
  icono?: LucideIcon;
  /** Ruta interna: hace de todo el mosaico un enlace. */
  to?: string;
  onClick?: () => void;
  /** Identificador estable para el asistente (data-guia). */
  guia?: string;
  className?: string;
}

/*
 * Fondo + color del glifo con los valores exactos del tablero (22:1352–22:1355 y 22:951).
 * Contraste del glifo (elemento gráfico, ≥ 3:1): crema sobre azul 5.44:1, sobre café 10.27:1, sobre
 * magenta #F62FA2 3.40:1; café sobre ámbar 6.16:1 y sobre lima 6.07:1; lima del logotipo sobre marino 8.73:1.
 * El texto de la etiqueta va FUERA del mosaico, en tinta sobre el fondo de la página.
 */
const COLORES: Record<TonoMosaico, string> = {
  azul: "bg-azul text-crema",
  ambar: "bg-ambar text-cafe",
  cafe: "bg-cafe text-crema",
  magenta: "bg-magenta text-crema",
  lima: "bg-lima text-cafe",
  marino: "bg-marino text-lima-logo",
};

/**
 * Mosaico de color del Laboratorio: cuadrado 1:1 con radio del 17.5 % del lado y el glifo pixelado al 66 %,
 * con su etiqueta de texto siempre debajo o al lado. Úsalo para categorías y accesos (56 px en listas,
 * 80 px en rejillas móviles, 120–184 px en escritorio).
 */
export function MosaicoLaboratorio({
  etiqueta,
  descripcion,
  tono = "azul",
  posicionEtiqueta = "debajo",
  tamano,
  icono: Icono,
  to,
  onClick,
  guia,
  className,
}: MosaicoLaboratorioProps) {
  const alLado = posicionEtiqueta === "lado";
  const cuadrado = (
    <span
      aria-hidden="true"
      style={tamano === undefined ? undefined : { width: tamano }}
      className={cx(
        "relative flex aspect-square shrink-0 items-center justify-center rounded-(--radio-mosaico) transition-transform duration-(--duracion-media) ease-suave motion-safe:group-hover:-translate-y-0.5",
        COLORES[tono],
        tamano === undefined && (alLado ? "w-14" : "w-full"),
      )}
    >
      {Icono ? (
        <Icono className="size-[42%]" strokeWidth={2} />
      ) : (
        <GlifoPixel className="h-auto w-(--glifo-mosaico)" />
      )}
    </span>
  );

  const texto = (
    <span className={cx("min-w-0", alLado ? "text-left" : "text-center")}>
      <span className="block text-sm leading-snug font-semibold text-tinta">{etiqueta}</span>
      {descripcion ? <span className="mt-0.5 block text-xs leading-snug text-tinta-suave">{descripcion}</span> : null}
    </span>
  );

  const clases = cx(
    "group flex min-h-11 gap-2.5 no-underline",
    alLado ? "flex-row items-center" : "flex-col items-center",
    (to || onClick) && "rounded-boton",
    className,
  );

  if (to) {
    return (
      <Link to={to} className={clases} data-guia={guia}>
        {cuadrado}
        {texto}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={clases} data-guia={guia}>
        {cuadrado}
        {texto}
      </button>
    );
  }
  return (
    <div className={clases} data-guia={guia}>
      {cuadrado}
      {texto}
    </div>
  );
}
