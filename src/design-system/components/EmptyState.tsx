import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import { LabGlyph } from "./LabGlyph";

export interface EmptyStateProps {
  titulo: string;
  descripcion?: ReactNode;
  /** Ícono de lucide; si no se da, se usa el glifo del Laboratorio. */
  icono?: LucideIcon;
  /** Acción principal (p. ej. un Button o ButtonLink). */
  accion?: ReactNode;
  /** Nivel del encabezado del título (h2 por omisión). */
  nivel?: 2 | 3;
  className?: string;
}

/** Estado vacío amable con ícono, texto breve y una acción útil. */
export function EmptyState({ titulo, descripcion, icono: Icono, accion, nivel = 2, className }: EmptyStateProps) {
  const Titulo = nivel === 2 ? "h2" : "h3";
  return (
    <div
      className={cx(
        "flex flex-col items-center rounded-tarjeta border border-dashed border-borde bg-superficie px-5 py-10 text-center",
        className,
      )}
    >
      <span className="mb-4 inline-flex size-16 items-center justify-center rounded-tarjeta bg-azul-suave text-azul">
        {Icono ? <Icono aria-hidden="true" className="size-8" /> : <LabGlyph tamano={34} />}
      </span>
      <Titulo className="text-lg font-semibold text-marino">{titulo}</Titulo>
      {descripcion ? <div className="mt-2 max-w-prose text-[0.9375rem] text-tinta-suave">{descripcion}</div> : null}
      {accion ? <div className="mt-6 flex flex-wrap justify-center gap-3">{accion}</div> : null}
    </div>
  );
}
