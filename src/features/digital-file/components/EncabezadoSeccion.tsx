import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "@/design-system";

export interface EncabezadoSeccionProps {
  /** id del h2 (para aria-labelledby de la sección). */
  id: string;
  titulo: string;
  icono: LucideIcon;
  /** Rótulo corto en mayúsculas sobre el título (estilo «UN TEJIDO» del Laboratorio). */
  rotulo?: string;
  descripcion?: ReactNode;
  /** Insignia o acción a la derecha. */
  extra?: ReactNode;
  className?: string;
}

/** Encabezado común de las secciones del expediente: ícono, rótulo, h2 y descripción breve. */
export function EncabezadoSeccion({ id, titulo, icono: Icono, rotulo, descripcion, extra, className }: EncabezadoSeccionProps) {
  return (
    <div className={cx("mb-4 flex flex-wrap items-start justify-between gap-x-3 gap-y-2", className)}>
      <div className="flex min-w-0 flex-[1_1_16rem] items-start gap-3">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-boton bg-azul-suave text-azul">
          <Icono aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          {rotulo ? (
            <p className="font-mono-rotulo text-xs font-medium tracking-[0.12em] text-tinta-suave uppercase">{rotulo}</p>
          ) : null}
          <h2 id={id} className="text-xl leading-tight font-semibold text-marino">
            {titulo}
          </h2>
          {descripcion ? <div className="mt-1 max-w-prose text-[0.9375rem] text-tinta-suave">{descripcion}</div> : null}
        </div>
      </div>
      {extra ? <div className="flex shrink-0 flex-wrap items-center gap-2">{extra}</div> : null}
    </div>
  );
}
