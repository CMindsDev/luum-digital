import { CircleAlert, CircleCheck, CircleX, Clock, PencilLine, Send, type LucideIcon } from "lucide-react";
import type { TonoInsignia } from "@/design-system";
import { msg } from "@/i18n";
import type { EstadoGestion, Gestion } from "@/types";

/** Estado de una gestión simulada con ícono + texto (nunca sólo color). */
export const ESTADO_GESTION: Record<EstadoGestion, { etiqueta: string; icono: LucideIcon; tono: TonoInsignia }> = {
  borrador: { etiqueta: msg("Borrador"), icono: PencilLine, tono: "neutro" },
  enviada: { etiqueta: msg("Enviada (simulada)"), icono: Send, tono: "azul" },
  en_revision: { etiqueta: msg("En revisión"), icono: Clock, tono: "info" },
  requiere_informacion: { etiqueta: msg("Requiere información"), icono: CircleAlert, tono: "aviso" },
  resuelta: { etiqueta: msg("Resuelta"), icono: CircleCheck, tono: "exito" },
  cancelada: { etiqueta: msg("Cancelada"), icono: CircleX, tono: "peligro" },
};

/** Las más recientes primero (por última actualización). */
export function gestionesRecientes(gestiones: readonly Gestion[], maximo = 3): Gestion[] {
  return [...gestiones].sort((a, b) => b.actualizadaEn.localeCompare(a.actualizadaEn)).slice(0, maximo);
}
