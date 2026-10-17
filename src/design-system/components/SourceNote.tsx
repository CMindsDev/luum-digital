import { ExternalLink, FileSearch } from "lucide-react";
import type { ReactNode } from "react";
import type { EstadoInformacion, FuenteConsultada } from "@/types";
import { cx } from "../lib/cx";
import { formatearFecha } from "../lib/fechas";
import { InfoStatusBadge } from "./InfoStatusBadge";

export interface SourceNoteProps {
  fuente: FuenteConsultada;
  /** Estado de la información mostrada con esta fuente. */
  estado?: EstadoInformacion;
  /** Nota adicional (p. ej. qué falta verificar). */
  nota?: ReactNode;
  className?: string;
}

/** Fuente oficial con enlace, fecha de consulta y estado de la información. */
export function SourceNote({ fuente, estado, nota, className }: SourceNoteProps) {
  return (
    <div className={cx("rounded-tarjeta border border-borde bg-superficie-2 px-4 py-3 text-sm text-tinta", className)}>
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <FileSearch aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-tinta-suave" />
        <div className="min-w-0 flex-1">
          <p>
            <span className="font-semibold">Fuente: </span>
            <a
              href={fuente.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium break-words text-enlace underline underline-offset-2"
            >
              {fuente.nombre}
              <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="sr-only">(se abre en otra pestaña)</span>
            </a>
          </p>
          <p className="mt-0.5 text-tinta-suave">
            Consultada el {formatearFecha(fuente.fechaConsulta, "media")}
            {fuente.fechaActualizacionFuente ? ` · Actualizada por la fuente: ${formatearFecha(fuente.fechaActualizacionFuente, "media")}` : ""}
          </p>
          {nota ? <div className="mt-1.5 text-tinta">{nota}</div> : null}
        </div>
        {estado ? <InfoStatusBadge estado={estado} /> : null}
      </div>
    </div>
  );
}
