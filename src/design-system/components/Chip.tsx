import { Check, X, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import { CLASES_ICONO_INSIGNIA, CLASES_INSIGNIA, type TonoInsignia } from "../lib/tonos";

export interface ChipProps {
  children: ReactNode;
  tono?: TonoInsignia;
  icono?: LucideIcon;
  /** Si se da, muestra un botón para quitar (p. ej. un filtro aplicado). */
  onQuitar?: () => void;
  /** Texto accesible del botón quitar; por omisión «Quitar <texto>». */
  etiquetaQuitar?: string;
  className?: string;
}

/** Ficha informativa (p. ej. filtro aplicado, palabra clave). */
export function Chip({ children, tono = "neutro", icono: Icono, onQuitar, etiquetaQuitar, className }: ChipProps) {
  return (
    <span className={cx("inline-flex min-h-8 items-center gap-1.5 rounded-pildora border pr-1 pl-3 text-sm font-medium", !onQuitar && "pr-3", CLASES_INSIGNIA[tono], className)}>
      {Icono ? <Icono aria-hidden="true" className={cx("size-4", CLASES_ICONO_INSIGNIA[tono])} /> : null}
      {children}
      {onQuitar ? (
        <button
          type="button"
          onClick={onQuitar}
          aria-label={etiquetaQuitar ?? `Quitar ${typeof children === "string" ? children : "filtro"}`}
          className="-my-1 inline-flex size-8 items-center justify-center rounded-full hover:bg-black/5"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      ) : null}
    </span>
  );
}

export interface FilterChipProps {
  children: ReactNode;
  seleccionado: boolean;
  onCambiar: (seleccionado: boolean) => void;
  icono?: LucideIcon;
  conteo?: number;
  guia?: string;
  className?: string;
}

/** Filtro conmutable (aria-pressed); seleccionado se marca con ícono de verificación además de color. */
export function FilterChip({ children, seleccionado, onCambiar, icono: Icono, conteo, guia, className }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={seleccionado}
      onClick={() => onCambiar(!seleccionado)}
      data-guia={guia}
      className={cx(
        "inline-flex min-h-11 items-center gap-1.5 rounded-pildora border-2 px-3.5 text-sm font-semibold transition-colors",
        seleccionado ? "border-marino bg-marino text-white" : "border-borde bg-superficie text-tinta hover:border-marino/60",
        className,
      )}
    >
      {seleccionado ? <Check aria-hidden="true" className="size-4" strokeWidth={3} /> : Icono ? <Icono aria-hidden="true" className="size-4" /> : null}
      {children}
      {conteo !== undefined ? (
        <span className={cx("rounded-pildora px-1.5 text-xs leading-5", seleccionado ? "bg-lima-logo text-marino" : "bg-superficie-2 text-tinta")}>{conteo}</span>
      ) : null}
    </button>
  );
}
