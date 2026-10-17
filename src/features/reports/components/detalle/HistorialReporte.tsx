import {
  BadgeCheck,
  CircleCheck,
  CircleX,
  Clock,
  Inbox,
  MessageSquarePlus,
  ScanSearch,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Timeline, type EventoTimeline, type TonoInsignia } from "@/design-system";
import type { EventoReporte } from "@/types";
import { msg } from "@/i18n";

const PRESENTACION: Record<EventoReporte["tipo"], { titulo: string; icono: LucideIcon; tono: TonoInsignia }> = {
  asignado: { titulo: msg("Equipo asignado (simulado)"), icono: Inbox, tono: "info" },
  contacto_simulado: { titulo: msg("Contacto simulado"), icono: MessageSquarePlus, tono: "azul" },
  creado: { titulo: msg("Registrado"), icono: Inbox, tono: "neutro" },
  aportacion: { titulo: msg("Aportación de información"), icono: MessageSquarePlus, tono: "azul" },
  validado: { titulo: msg("En proceso de atención"), icono: Clock, tono: "info" },
  atencion_registrada: { titulo: msg("Solucionado (atención reportada)"), icono: CircleCheck, tono: "exito" },
  cancelado: { titulo: msg("Cancelado"), icono: CircleX, tono: "peligro" },
  verificacion_recibida: { titulo: msg("Verificación ciudadana recibida"), icono: ScanSearch, tono: "azul" },
  verificacion_aprobada: { titulo: msg("Verificación ciudadana aprobada"), icono: BadgeCheck, tono: "exito" },
  verificacion_rechazada: { titulo: msg("Verificación ciudadana rechazada"), icono: CircleX, tono: "aviso" },
  verificacion_revertida: { titulo: msg("Verificación ciudadana revertida"), icono: Undo2, tono: "aviso" },
};

const ACTOR: Record<EventoReporte["actor"], string> = {
  ciudadania: msg("Ciudadanía"),
  operador: msg("Operador de demostración"),
  sistema_demo: msg("Sistema (simulado)"),
};

/** Línea de tiempo del reporte: cada evento con ícono, texto, fecha y quién lo hizo. */
export function HistorialReporte({ historial }: { historial: EventoReporte[] }) {
  const { t } = useTranslation();
  const eventos: EventoTimeline[] = historial.map((evento, indice) => {
    const { titulo, icono, tono } = PRESENTACION[evento.tipo];
    return {
      id: `${evento.fecha}-${indice}`,
      titulo: t(titulo),
      fecha: evento.fecha,
      icono,
      tono,
      actual: indice === historial.length - 1,
      descripcion: (
        <>
          {evento.descripcion}
          <span className="mt-0.5 block text-sm text-tinta-suave">{t(ACTOR[evento.actor])}</span>
        </>
      ),
    };
  });
  return <Timeline eventos={eventos} etiqueta={t("Historial del reporte")} />;
}
