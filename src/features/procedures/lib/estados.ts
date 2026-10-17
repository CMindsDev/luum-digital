import { CircleAlert, CircleCheck, CircleX, Hourglass, PenLine, Send, type LucideIcon } from "lucide-react";
import type { TonoInsignia } from "@/design-system";
import { msg } from "@/i18n";
import type { EstadoGestion, EventoGestion, Gestion } from "@/types";

export const ETIQUETA_ESTADO_GESTION: Record<EstadoGestion, string> = {
  borrador: msg("Borrador"),
  enviada: msg("Enviada"),
  en_revision: msg("En revisión"),
  requiere_informacion: msg("Requiere información"),
  resuelta: msg("Resuelta"),
  cancelada: msg("Cancelada"),
};

export const ETIQUETA_GRUPO_ESTADO: Record<EstadoGestion, string> = {
  borrador: msg("Borradores"),
  enviada: msg("Enviadas"),
  en_revision: msg("En revisión"),
  requiere_informacion: msg("Requieren información"),
  resuelta: msg("Resueltas"),
  cancelada: msg("Canceladas"),
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

export const ORDEN_ESTADOS: readonly EstadoGestion[] = ["requiere_informacion", "borrador", "enviada", "en_revision", "resuelta", "cancelada"];

export const ETIQUETA_ACTOR: Record<EventoGestion["actor"], string> = {
  ciudadania: msg("Tú"),
  sistema_demo: msg("Sistema de demostración"),
  operador: msg("Operador de demostración"),
};

export function agruparPorEstado(gestiones: readonly Gestion[]): Array<{ estado: EstadoGestion; gestiones: Gestion[] }> {
  return ORDEN_ESTADOS.map((estado) => ({ estado, gestiones: gestiones.filter((gestion) => gestion.estado === estado) })).filter(
    (grupo) => grupo.gestiones.length > 0,
  );
}

export function sePuedeCancelar(gestion: Pick<Gestion, "estado">): boolean {
  return gestion.estado !== "cancelada" && gestion.estado !== "resuelta";
}
