import { CircleCheck, CircleMinus, CircleX, Hourglass, Undo2, type LucideIcon } from "lucide-react";
import type { TonoInsignia } from "@/design-system";
import type { EstadoMovimiento, MovimientoPuntos, TipoMovimiento } from "@/types";

/**
 * Presentación de los movimientos de puntos (reglas de demostración). Los estados se muestran
 * siempre con ícono + texto: sólo los movimientos «Aprobado» cuentan en el saldo.
 */

export const ETIQUETA_TIPO_MOVIMIENTO: Record<TipoMovimiento, string> = {
  reporte_validado: "Reporte",
  verificacion_aprobada: "Verificación",
  canje: "Canje de ejemplo",
  reversion: "Reversión",
  cancelacion: "Cancelación",
};

export const ETIQUETA_ESTADO_MOVIMIENTO: Record<EstadoMovimiento, string> = {
  pendiente: "Pendiente de validación",
  aprobado: "Aprobado",
  cancelado: "Cancelado: no suma",
  revertido: "Revertido",
};

export const ICONO_ESTADO_MOVIMIENTO: Record<EstadoMovimiento, LucideIcon> = {
  pendiente: Hourglass,
  aprobado: CircleCheck,
  cancelado: CircleX,
  revertido: Undo2,
};

export const TONO_ESTADO_MOVIMIENTO: Record<EstadoMovimiento, TonoInsignia> = {
  pendiente: "aviso",
  aprobado: "exito",
  cancelado: "neutro",
  revertido: "peligro",
};

/**
 * Estado visible de un movimiento. Un débito aprobado (canje o reversión) se muestra como
 * «Descontado» para no confundirlo con un crédito aprobado.
 */
export function describirEstadoMovimiento(movimiento: Pick<MovimientoPuntos, "estado" | "puntos">): {
  etiqueta: string;
  icono: LucideIcon;
  tono: TonoInsignia;
} {
  if (movimiento.estado === "aprobado" && movimiento.puntos < 0) return { etiqueta: "Descontado", icono: CircleMinus, tono: "neutro" };
  return {
    etiqueta: ETIQUETA_ESTADO_MOVIMIENTO[movimiento.estado],
    icono: ICONO_ESTADO_MOVIMIENTO[movimiento.estado],
    tono: TONO_ESTADO_MOVIMIENTO[movimiento.estado],
  };
}

const FORMATO_CON_SIGNO = new Intl.NumberFormat("es-MX", { signDisplay: "exceptZero" });
const FORMATO = new Intl.NumberFormat("es-MX");

/** «+40», «−100» o «0». */
export function formatearPuntosConSigno(puntos: number): string {
  return FORMATO_CON_SIGNO.format(puntos).replace("-", "−");
}

/** «1,250». */
export function formatearPuntos(puntos: number): string {
  return FORMATO.format(puntos);
}

/** «1 punto» / «40 puntos». */
export function puntosEnTexto(puntos: number): string {
  return `${formatearPuntos(puntos)} ${Math.abs(puntos) === 1 ? "punto" : "puntos"}`;
}
