import type { Notificacion } from "@/types";
import { IDS_SEMILLA } from "./reportes-semilla";

/**
 * Notificaciones simuladas iniciales. Bienestar, salud mental y Línea Mujer nunca generan
 * notificaciones (AGENTS.md §7).
 */

const HORA = 3_600_000;

function haceHoras(ahora: Date, horas: number): string {
  return new Date(ahora.getTime() - horas * HORA).toISOString();
}

export function crearNotificacionesSemilla(ahora: Date): Notificacion[] {
  return [
    {
      id: "not-0001",
      identidadId: "ana",
      fecha: haceHoras(ahora, 3),
      tipo: "reporte",
      titulo: "Tu reporte DEMO-R-0000005 fue registrado",
      cuerpo: "Lo revisará el operador de demostración. Tus puntos quedan pendientes hasta la validación.",
      enlace: `/reportes/${IDS_SEMILLA.anaRegistrado}`,
      leida: false,
      sensible: false,
    },
    {
      id: "not-0002",
      identidadId: "ana",
      fecha: haceHoras(ahora, 30),
      tipo: "verificacion",
      titulo: "Atención reportada en tu reporte DEMO-R-0000002",
      cuerpo: "El Ayuntamiento (simulado) reportó la atención. Otra persona podrá verificarla.",
      enlace: `/reportes/${IDS_SEMILLA.luminariaAnaSolucionada}`,
      leida: false,
      sensible: false,
    },
    {
      id: "not-0003",
      identidadId: "ana",
      fecha: haceHoras(ahora, 96),
      tipo: "gestion",
      titulo: "Tu gestión DEMO-G-0000001 está en revisión",
      cuerpo: "Gestión simulada: no llega a ningún sistema municipal.",
      enlace: "/gestiones/ges-0001",
      leida: true,
      sensible: false,
    },
    {
      id: "not-0004",
      identidadId: "ana",
      fecha: haceHoras(ahora, 160),
      tipo: "puntos",
      titulo: "Se aprobaron 40 puntos de demostración",
      cuerpo: "Tu reporte DEMO-R-0000004 fue validado.",
      enlace: "/participacion/recompensas",
      leida: true,
      sensible: false,
    },
    {
      id: "not-0005",
      identidadId: "bruno",
      fecha: haceHoras(ahora, 20),
      tipo: "verificacion",
      titulo: "Hay un reporte cerca que puedes verificar",
      cuerpo: "La luminaria DEMO-R-0000002 tiene atención reportada. Tu verificación ayuda a confirmar la reparación.",
      enlace: `/participacion/verificar/${IDS_SEMILLA.luminariaAnaSolucionada}`,
      leida: false,
      sensible: false,
    },
    {
      id: "not-0006",
      identidadId: "bruno",
      fecha: haceHoras(ahora, 70),
      tipo: "reporte",
      titulo: "Tu reporte DEMO-R-0000001 fue registrado",
      cuerpo: "Bache en Calle 60 x 59 y 61, Centro. Pendiente de validación (simulado).",
      enlace: `/reportes/${IDS_SEMILLA.bacheCentroBruno}`,
      leida: true,
      sensible: false,
    },
    {
      id: "not-0007",
      identidadId: "operador",
      fecha: haceHoras(ahora, 2),
      tipo: "sistema",
      titulo: "Reportes y verificaciones por revisar",
      cuerpo: "Hay reportes registrados por validar y una verificación ciudadana pendiente de revisión.",
      enlace: "/operador",
      leida: false,
      sensible: false,
    },
    {
      id: "not-0008",
      identidadId: "admin",
      fecha: haceHoras(ahora, 5),
      tipo: "sistema",
      titulo: "Demanda agregada disponible (datos ficticios)",
      cuerpo: "Las celdas con menos de 10 registros se ocultan.",
      enlace: "/operador",
      leida: false,
      sensible: false,
    },
  ];
}
