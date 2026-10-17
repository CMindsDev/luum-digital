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
import { Timeline, type EventoTimeline, type TonoInsignia } from "@/design-system";
import type { EventoReporte } from "@/types";

const PRESENTACION: Record<EventoReporte["tipo"], { titulo: string; icono: LucideIcon; tono: TonoInsignia }> = {
  asignado: { titulo: "Equipo asignado (simulado)", icono: Inbox, tono: "info" },
  contacto_simulado: { titulo: "Contacto simulado", icono: MessageSquarePlus, tono: "azul" },
  creado: { titulo: "Registrado", icono: Inbox, tono: "neutro" },
  aportacion: { titulo: "Aportación de información", icono: MessageSquarePlus, tono: "azul" },
  validado: { titulo: "En proceso de atención", icono: Clock, tono: "info" },
  atencion_registrada: { titulo: "Solucionado (atención reportada)", icono: CircleCheck, tono: "exito" },
  cancelado: { titulo: "Cancelado", icono: CircleX, tono: "peligro" },
  verificacion_recibida: { titulo: "Verificación ciudadana recibida", icono: ScanSearch, tono: "azul" },
  verificacion_aprobada: { titulo: "Verificación ciudadana aprobada", icono: BadgeCheck, tono: "exito" },
  verificacion_rechazada: { titulo: "Verificación ciudadana rechazada", icono: CircleX, tono: "aviso" },
  verificacion_revertida: { titulo: "Verificación ciudadana revertida", icono: Undo2, tono: "aviso" },
};

const ACTOR: Record<EventoReporte["actor"], string> = {
  ciudadania: "Ciudadanía",
  operador: "Operador de demostración",
  sistema_demo: "Sistema (simulado)",
};

/** Línea de tiempo del reporte: cada evento con ícono, texto, fecha y quién lo hizo. */
export function HistorialReporte({ historial }: { historial: EventoReporte[] }) {
  const eventos: EventoTimeline[] = historial.map((evento, indice) => {
    const { titulo, icono, tono } = PRESENTACION[evento.tipo];
    return {
      id: `${evento.fecha}-${indice}`,
      titulo,
      fecha: evento.fecha,
      icono,
      tono,
      actual: indice === historial.length - 1,
      descripcion: (
        <>
          {evento.descripcion}
          <span className="mt-0.5 block text-sm text-tinta-suave">{ACTOR[evento.actor]}</span>
        </>
      ),
    };
  });
  return <Timeline eventos={eventos} etiqueta="Historial del reporte" />;
}
