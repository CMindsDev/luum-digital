import { Check } from "lucide-react";
import { useId, type ReactNode } from "react";
import { cx } from "../lib/cx";

export interface SwitchProps {
  activado: boolean;
  onCambiar: (activado: boolean) => void;
  etiqueta: ReactNode;
  descripcion?: ReactNode;
  deshabilitado?: boolean;
  /** Identificador para el asistente (data-guia). */
  guia?: string;
  className?: string;
}

/** Interruptor (role="switch"). El estado se ve por posición, ícono y texto, no sólo por color. */
export function Switch({ activado, onCambiar, etiqueta, descripcion, deshabilitado = false, guia, className }: SwitchProps) {
  const base = useId().replace(/:/g, "");
  const idEtiqueta = `${base}-etiqueta`;
  const idDescripcion = descripcion ? `${base}-descripcion` : undefined;
  return (
    <div className={cx("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <p id={idEtiqueta} className="font-semibold text-tinta">
          {etiqueta}
        </p>
        {descripcion ? (
          <p id={idDescripcion} className="mt-0.5 text-sm text-tinta-suave">
            {descripcion}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={activado}
        aria-labelledby={idEtiqueta}
        aria-describedby={idDescripcion}
        disabled={deshabilitado}
        onClick={() => onCambiar(!activado)}
        data-guia={guia}
        className="group inline-flex min-h-11 shrink-0 items-center gap-2 rounded-pildora px-1 disabled:cursor-not-allowed disabled:opacity-55"
      >
        <span className="w-8 text-right text-sm font-semibold text-tinta-suave" aria-hidden="true">
          {activado ? "Sí" : "No"}
        </span>
        <span
          aria-hidden="true"
          className={cx(
            "relative inline-flex h-7 w-12 items-center rounded-pildora border-2 transition-colors duration-(--duracion-media)",
            activado ? "border-marino bg-marino" : "border-borde-control bg-superficie-2",
          )}
        >
          <span
            className={cx(
              "absolute inline-flex size-5 items-center justify-center rounded-full shadow-suave transition-transform duration-(--duracion-media) ease-suave",
              activado ? "translate-x-[1.375rem] bg-lima-logo text-marino" : "translate-x-0.5 bg-superficie",
            )}
          >
            {activado ? <Check className="size-3.5" strokeWidth={3} /> : null}
          </span>
        </span>
      </button>
    </div>
  );
}
