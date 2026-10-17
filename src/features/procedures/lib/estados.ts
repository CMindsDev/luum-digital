import { CircleAlert, CircleCheck, CircleX, Hourglass, PenLine, Send, type LucideIcon } from "lucide-react";
import type { TonoInsignia } from "@/design-system";
import type { EstadoGestion, EventoGestion, Gestion } from "@/types";

/** Estados de una gestión simulada: siempre ícono + texto (el color sólo refuerza). */
export const ETIQUETA_ESTADO_GESTION: Record<EstadoGestion, string> = {
  borrador: "Borrador",
  enviada: "Enviada",
  en_revision: "En revisión",
  requiere_informacion: "Requiere información",
  resuelta: "Resuelta",
  cancelada: "Cancelada",
};

export const ETIQUETA_GRUPO_ESTADO: Record<EstadoGestion, string> = {
  borrador: "Borradores",
  enviada: "Enviadas",
  en_revision: "En revisión",
  requiere_informacion: "Requieren información",
  resuelta: "Resueltas",
  cancelada: "Canceladas",
};

export const ICONO_ESTADO_GESTION: Record<EstadoGestion, LucideIcon> = {
  borrador: PenLine,
  enviada: Send,
  en_revision: Hourglass,
  requiere_informacion: CircleAlert,
  resuelta: CircleCheck,
  cancelada: CircleX,
};

export const TONO_ESTADO_GESTION: Record<EstadoGestion, TonoInsignia> = {
  borrador: "neutro",
  enviada: "info",
  en_revision: "aviso",
  requiere_informacion: "peligro",
  resuelta: "exito",
  cancelada: "neutro",
};

/** Orden de los grupos en «Mis gestiones»: primero lo que pide acción. */
export const ORDEN_ESTADOS: readonly EstadoGestion[] = ["requiere_informacion", "borrador", "enviada", "en_revision", "resuelta", "cancelada"];

export const ETIQUETA_ACTOR: Record<EventoGestion["actor"], string> = {
  ciudadania: "Tú",
  sistema_demo: "Sistema de demostración",
  operador: "Operador de demostración",
};

export function agruparPorEstado(gestiones: readonly Gestion[]): Array<{ estado: EstadoGestion; gestiones: Gestion[] }> {
  return ORDEN_ESTADOS.map((estado) => ({ estado, gestiones: gestiones.filter((gestion) => gestion.estado === estado) })).filter(
    (grupo) => grupo.gestiones.length > 0,
  );
}

export function sePuedeCancelar(gestion: Pick<Gestion, "estado">): boolean {
  return gestion.estado !== "cancelada" && gestion.estado !== "resuelta";
}
