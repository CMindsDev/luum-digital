import { BadgeCheck, CircleCheck, CircleHelp, CircleX, Hourglass, TriangleAlert, Undo2, type LucideIcon } from "lucide-react";
import type { TonoInsignia } from "@/design-system";
import { msg } from "@/i18n";
import type { EstadoRevision, Reporte, ResultadoVerificacion } from "@/types";

/**
 * Presentación de la verificación ciudadana (propuesta del prototipo; no existe en Mérida Móvil).
 * Las reglas viven en src/domain/verificacion.ts; aquí sólo hay textos e íconos.
 */

export interface OpcionResultado {
  valor: ResultadoVerificacion;
  /** Texto de la opción, en presente (brief §11). */
  etiqueta: string;
  descripcion: string;
  icono: LucideIcon;
}

export const OPCIONES_RESULTADO: readonly OpcionResultado[] = [
  {
    valor: "reparacion_completada",
    etiqueta: msg("La reparación parece completada"),
    descripcion: msg("Estuviste en el lugar y el problema ya no se ve."),
    icono: CircleCheck,
  },
  {
    valor: "problema_persiste",
    etiqueta: msg("El problema persiste"),
    descripcion: msg("Estuviste en el lugar y el problema sigue ahí, total o parcialmente."),
    icono: TriangleAlert,
  },
  {
    valor: "no_puedo_comprobar",
    etiqueta: msg("No puedo comprobarlo"),
    descripcion: msg("No pudiste ver bien el punto o no estás seguro. También es una respuesta útil."),
    icono: CircleHelp,
  },
];

export const ICONO_RESULTADO: Record<ResultadoVerificacion, LucideIcon> = {
  reparacion_completada: CircleCheck,
  problema_persiste: TriangleAlert,
  no_puedo_comprobar: CircleHelp,
};

export const ETIQUETA_REVISION: Record<EstadoRevision, string> = {
  pendiente_revision: msg("Pendiente de revisión"),
  aprobada: msg("Aprobada"),
  rechazada: msg("No aprobada"),
  revertida: msg("Validación revertida"),
};

export const ICONO_REVISION: Record<EstadoRevision, LucideIcon> = {
  pendiente_revision: Hourglass,
  aprobada: BadgeCheck,
  rechazada: CircleX,
  revertida: Undo2,
};

export const TONO_REVISION: Record<EstadoRevision, TonoInsignia> = {
  pendiente_revision: "aviso",
  aprobada: "exito",
  rechazada: "peligro",
  revertida: "peligro",
};

/** Fecha en que el Ayuntamiento (simulado) reportó la atención; si no hay evento, la última actualización. */
export function fechaAtencion(reporte: Pick<Reporte, "historial" | "actualizadoEn">): string {
  const evento = [...reporte.historial].reverse().find((e) => e.tipo === "atencion_registrada");
  return evento?.fecha ?? reporte.actualizadoEn;
}
