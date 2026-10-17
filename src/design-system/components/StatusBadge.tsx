import type { EstadoMunicipal, MotivoCancelacion } from "@/types";
import { cx } from "../lib/cx";
import { ETIQUETA_ESTADO_MUNICIPAL, ETIQUETA_MOTIVO_CANCELACION, ICONO_ESTADO_MUNICIPAL } from "../lib/estados";

/*
 * Colores de estatus de Mérida Móvil (punto) + fondo suave y tinta oscura para el texto:
 * registrado-tinta #4F5B73 sobre #EEF1F6 6.03:1 · proceso-tinta #3F5480 sobre #E9EDF4 6.41:1 ·
 * solucionado-tinta #3B6D1A sobre #EDF5E1 5.53:1 · cancelado-tinta #A63A33 sobre #FBE9E7 5.47:1.
 */
const CLASES: Record<EstadoMunicipal, { caja: string; punto: string }> = {
  registrado: { caja: "bg-estado-registrado-suave text-estado-registrado-tinta border-estado-registrado", punto: "bg-estado-registrado" },
  en_proceso: { caja: "bg-estado-proceso-suave text-estado-proceso-tinta border-estado-proceso", punto: "bg-estado-proceso" },
  solucionado: {
    caja: "bg-estado-solucionado-suave text-estado-solucionado-tinta border-estado-solucionado",
    punto: "bg-estado-solucionado",
  },
  cancelado: { caja: "bg-estado-cancelado-suave text-estado-cancelado-tinta border-estado-cancelado", punto: "bg-estado-cancelado" },
};

export interface StatusBadgeProps {
  /** Estado municipal del reporte (lo que informa el Ayuntamiento). */
  estado: EstadoMunicipal;
  /** Motivo, si el estado es «cancelado». */
  motivo?: MotivoCancelacion;
  tamano?: "sm" | "md";
  className?: string;
}

/** Estado municipal con punto de color de Mérida Móvil + ícono + texto (nunca sólo color). */
export function StatusBadge({ estado, motivo, tamano = "sm", className }: StatusBadgeProps) {
  const Icono = ICONO_ESTADO_MUNICIPAL[estado];
  const clases = CLASES[estado];
  const texto = estado === "cancelado" && motivo ? `Cancelado: ${ETIQUETA_MOTIVO_CANCELACION[motivo]}` : ETIQUETA_ESTADO_MUNICIPAL[estado];
  return (
    <span
      data-estado={estado}
      className={cx(
        "inline-flex max-w-full items-center gap-1.5 rounded-pildora border font-semibold",
        tamano === "sm" ? "px-2.5 py-0.5 text-xs leading-5" : "px-3 py-1 text-sm",
        clases.caja,
        className,
      )}
    >
      <span aria-hidden="true" className={cx("size-2 shrink-0 rounded-full", clases.punto)} />
      <Icono aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="sr-only">Estado municipal: </span>
      <span className="truncate">{texto}</span>
    </span>
  );
}
