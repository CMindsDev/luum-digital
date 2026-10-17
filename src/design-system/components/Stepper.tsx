import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cx } from "../lib/cx";

export interface PasoStepper {
  id: string;
  titulo: string;
}

export interface StepperProps {
  pasos: PasoStepper[];
  /** Índice del paso actual (0 = primero). */
  actual: number;
  /** Nombre accesible de la lista de pasos. */
  etiqueta?: string;
  className?: string;
}

/** Pasos de un asistente de formulario. En móvil muestra «Paso n de m» con barra de progreso. */
export function Stepper({ pasos, actual, etiqueta, className }: StepperProps) {
  const { t } = useTranslation();
  const total = pasos.length;
  const indice = Math.min(Math.max(actual, 0), Math.max(total - 1, 0));
  const pasoActual = pasos[indice];
  return (
    <nav aria-label={etiqueta ?? t("Pasos del trámite")} className={className}>
      <div className="sm:hidden">
        <p className="text-sm font-semibold text-marino">
          {t("Paso {{actual}} de {{total}}", { actual: indice + 1, total })}
          {pasoActual ? <span className="font-normal text-tinta-suave"> · {pasoActual.titulo}</span> : null}
        </p>
        <div aria-hidden="true" className="mt-2 h-2 overflow-hidden rounded-pildora bg-superficie-2">
          <div className="h-full rounded-pildora bg-lima-logo transition-[width]" style={{ width: `${((indice + 1) / Math.max(total, 1)) * 100}%` }} />
        </div>
      </div>
      <ol className="hidden items-center gap-2 sm:flex">
        {pasos.map((paso, i) => {
          const completado = i < indice;
          const esActual = i === indice;
          return (
            <li key={paso.id} aria-current={esActual ? "step" : undefined} className="flex min-w-0 flex-1 items-center gap-2">
              <span
                aria-hidden="true"
                className={cx(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold",
                  completado && "border-exito bg-exito text-white",
                  esActual && "border-marino bg-marino text-white",
                  !completado && !esActual && "border-borde-control bg-superficie text-tinta-suave",
                )}
              >
                {completado ? <Check className="size-4" strokeWidth={3} /> : i + 1}
              </span>
              <span className={cx("truncate text-sm", esActual ? "font-semibold text-marino" : "text-tinta-suave")}>
                {paso.titulo}
                <span className="sr-only">{completado ? ` ${t("(completado)")}` : esActual ? ` ${t("(paso actual)")}` : ` ${t("(pendiente)")}`}</span>
              </span>
              {i < total - 1 ? <span aria-hidden="true" className={cx("h-0.5 min-w-4 flex-1 rounded-pildora", completado ? "bg-exito" : "bg-borde")} /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
