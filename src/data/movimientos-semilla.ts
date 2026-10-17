import type { MovimientoPuntos } from "@/types";
import { REGLAS_PUNTOS_DEMO } from "./reglas-puntos";
import { IDS_SEMILLA } from "./reportes-semilla";

/**
 * Movimientos de puntos FICTICIOS iniciales, coherentes con los reportes y verificaciones semilla.
 * Ana tiene saldo aprobado suficiente para canjear el beneficio más barato (100 puntos).
 *
 *   Ana:   +40 (rep-0002 validado) +40 (rep-0004 validado) +25 (ver-0001 aprobada) = 105 disponibles
 *          +40 pendientes (rep-0005 registrado)
 *   Bruno: +40 (rep-0003 validado) = 40 disponibles
 *          +40 pendientes (rep-0001 registrado) +30 pendientes (ver-0002 en revisión)
 */

const DIA = 86_400_000;

function haceDias(ahora: Date, dias: number): string {
  return new Date(ahora.getTime() - dias * DIA).toISOString();
}

export function crearMovimientosSemilla(ahora: Date): MovimientoPuntos[] {
  const r = REGLAS_PUNTOS_DEMO;
  return [
    {
      id: "mov-0001",
      identidadId: "ana",
      claveEvento: `reporte:${IDS_SEMILLA.luminariaAnaSolucionada}:validado`,
      tipo: "reporte_validado",
      puntos: r.reporteValidado,
      estado: "aprobado",
      motivo: "Reporte DEMO-R-0000002 validado (simulado).",
      fecha: haceDias(ahora, 11),
      referenciaId: IDS_SEMILLA.luminariaAnaSolucionada,
    },
    {
      id: "mov-0002",
      identidadId: "ana",
      claveEvento: `reporte:${IDS_SEMILLA.anaEnProceso}:validado`,
      tipo: "reporte_validado",
      puntos: r.reporteValidado,
      estado: "aprobado",
      motivo: "Reporte DEMO-R-0000004 validado (simulado).",
      fecha: haceDias(ahora, 7),
      referenciaId: IDS_SEMILLA.anaEnProceso,
    },
    {
      id: "mov-0003",
      identidadId: "ana",
      claveEvento: `verificacion:${IDS_SEMILLA.verificacionAnaAprobada}:aprobada`,
      tipo: "verificacion_aprobada",
      puntos: r.verificacionBase + r.verificacionBonoCalidad * 2,
      estado: "aprobado",
      motivo: "Verificación del reporte DEMO-R-0000003 aprobada (comentario útil y ubicación confirmada).",
      fecha: haceDias(ahora, 13),
      referenciaId: IDS_SEMILLA.verificacionAnaAprobada,
    },
    {
      id: "mov-0004",
      identidadId: "ana",
      claveEvento: `reporte:${IDS_SEMILLA.anaRegistrado}:validado`,
      tipo: "reporte_validado",
      puntos: r.reporteValidado,
      estado: "pendiente",
      motivo: "Reporte DEMO-R-0000005 enviado: pendiente de validación (simulado).",
      fecha: haceDias(ahora, 1),
      referenciaId: IDS_SEMILLA.anaRegistrado,
    },
    {
      id: "mov-0005",
      identidadId: "bruno",
      claveEvento: `reporte:${IDS_SEMILLA.bacheBrunoVerificadoPorAna}:validado`,
      tipo: "reporte_validado",
      puntos: r.reporteValidado,
      estado: "aprobado",
      motivo: "Reporte DEMO-R-0000003 validado (simulado).",
      fecha: haceDias(ahora, 19),
      referenciaId: IDS_SEMILLA.bacheBrunoVerificadoPorAna,
    },
    {
      id: "mov-0006",
      identidadId: "bruno",
      claveEvento: `reporte:${IDS_SEMILLA.bacheCentroBruno}:validado`,
      tipo: "reporte_validado",
      puntos: r.reporteValidado,
      estado: "pendiente",
      motivo: "Reporte DEMO-R-0000001 enviado: pendiente de validación (simulado).",
      fecha: haceDias(ahora, 3),
      referenciaId: IDS_SEMILLA.bacheCentroBruno,
    },
    {
      id: "mov-0007",
      identidadId: "bruno",
      claveEvento: `verificacion:${IDS_SEMILLA.verificacionBrunoPendiente}:aprobada`,
      tipo: "verificacion_aprobada",
      puntos: r.verificacionBase + r.verificacionBonoCalidad * 3,
      estado: "pendiente",
      motivo: "Verificación del reporte DEMO-R-0000006 enviada: pendiente de revisión.",
      fecha: haceDias(ahora, 2),
      referenciaId: IDS_SEMILLA.verificacionBrunoPendiente,
    },
  ];
}
