import { Circle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cx } from "../lib/cx";
import { formatearFechaHora } from "../lib/fechas";
import { CLASES_ICONO_INSIGNIA, CLASES_INSIGNIA, type TonoInsignia } from "../lib/tonos";

export interface EventoTimeline {
  id: string;
  titulo: string;
  /** Fecha ISO; se muestra en hora de Mérida. */
  fecha?: string;
  descripcion?: ReactNode;
  icono?: LucideIcon;
  tono?: TonoInsignia;
  /** Marca el evento más reciente / actual. */
  actual?: boolean;
}

export interface TimelineProps {
  eventos: EventoTimeline[];
  /** Nombre accesible de la lista. */
  etiqueta?: string;
  className?: string;
}

/** Historial cronológico (gestiones, reportes). Cada evento con ícono + texto + fecha. */
export function Timeline({ eventos, etiqueta, className }: TimelineProps) {
  const { t } = useTranslation();
  return (
    <ol aria-label={etiqueta ?? t("Historial")} className={cx("relative", className)}>
      {eventos.map((evento, indice) => {
        const Icono = evento.icono ?? Circle;
        const tono = evento.tono ?? "neutro";
        const ultimo = indice === eventos.length - 1;
        return (
          <li key={evento.id} aria-current={evento.actual ? "step" : undefined} className="relative flex gap-3 pb-5 last:pb-0">
            {!ultimo ? <span aria-hidden="true" className="absolute top-9 bottom-0 left-[1.0625rem] w-0.5 bg-borde" /> : null}
            <span aria-hidden="true" className={cx("relative z-10 inline-flex size-9 shrink-0 items-center justify-center rounded-full border", CLASES_INSIGNIA[tono])}>
              <Icono className={cx("size-4", CLASES_ICONO_INSIGNIA[tono])} />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className={cx("font-semibold", evento.actual ? "text-marino" : "text-tinta")}>
                {evento.titulo}
                {evento.actual ? <span className="sr-only"> {t("(más reciente)")}</span> : null}
              </p>
              {evento.fecha ? (
                <p className="text-sm text-tinta-suave">
                  <time dateTime={evento.fecha}>{formatearFechaHora(evento.fecha)}</time>
                </p>
              ) : null}
              {evento.descripcion ? <div className="mt-1 text-[0.9375rem] text-tinta">{evento.descripcion}</div> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
