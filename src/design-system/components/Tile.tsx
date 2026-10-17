import { ChevronRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { cx } from "../lib/cx";
import { CLASES_BORDE_ACCESO, CLASES_ICONO_ACCESO, CLASES_MOSAICO, type TonoMosaico } from "../lib/tonos";
import { LabGlyph } from "./LabGlyph";

export interface TileProps {
  etiqueta: string;
  descripcion?: string;
  /** Ícono de contorno de lucide. Sin ícono, el mosaico usa el glifo pixelado del Laboratorio. */
  icono?: LucideIcon;
  tono?: TonoMosaico;
  /**
   * mosaico: tarjeta de color del Laboratorio (ícono + etiqueta).
   * acceso: acceso rápido de Mérida Móvil (tarjeta clara, ícono de contorno y borde inferior de color).
   */
  variante?: "mosaico" | "acceso";
  /** Ruta interna (Link). */
  to?: string;
  /** Acción si no hay ruta. */
  onClick?: () => void;
  /** Identificador estable para el asistente (data-guia), p. ej. "inicio.acceso_reportes". */
  guia?: string;
  /** Elemento adicional (p. ej. una insignia). */
  extra?: ReactNode;
  className?: string;
}

export function Tile({ etiqueta, descripcion, icono: Icono, tono = "azul", variante = "mosaico", to, onClick, guia, extra, className }: TileProps) {
  const esMosaico = variante === "mosaico";
  const colores = CLASES_MOSAICO[tono];

  const clases = cx(
    "group relative flex h-full min-h-11 w-full text-left no-underline transition-[box-shadow,transform] duration-(--duracion-media) ease-suave motion-safe:hover:-translate-y-0.5",
    esMosaico
      ? cx("min-h-36 flex-col justify-between gap-4 rounded-tarjeta p-4 shadow-suave hover:shadow-elevada sm:p-5", colores.fondo, colores.texto)
      : cx(
          "min-h-32 flex-col items-center justify-center gap-2.5 rounded-tarjeta border border-borde border-b-4 bg-superficie px-3 py-4 text-center text-marino shadow-suave hover:shadow-elevada",
          CLASES_BORDE_ACCESO[tono],
        ),
    className,
  );

  const contenido = esMosaico ? (
    <>
      <span className="flex items-start justify-between gap-2">
        {Icono ? (
          <Icono aria-hidden="true" className={cx("size-8", colores.icono)} strokeWidth={2} />
        ) : (
          <LabGlyph tamano={34} className={colores.icono} />
        )}
        {extra}
      </span>
      <span className="flex items-end justify-between gap-2">
        <span>
          <span className="block text-base leading-snug font-semibold">{etiqueta}</span>
          {descripcion ? <span className="mt-1 block text-sm leading-snug opacity-95">{descripcion}</span> : null}
        </span>
        {to ? <ChevronRight aria-hidden="true" className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5" /> : null}
      </span>
    </>
  ) : (
    <>
      <span className={cx("inline-flex size-12 items-center justify-center rounded-boton text-marino", CLASES_ICONO_ACCESO[tono])}>
        {Icono ? <Icono aria-hidden="true" className="size-6" strokeWidth={1.75} /> : <LabGlyph tamano={22} />}
      </span>
      <span className="text-sm leading-snug font-semibold">{etiqueta}</span>
      {descripcion ? <span className="text-xs leading-snug text-tinta-suave">{descripcion}</span> : null}
      {extra}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={clases} data-guia={guia}>
        {contenido}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={clases} data-guia={guia}>
      {contenido}
    </button>
  );
}
