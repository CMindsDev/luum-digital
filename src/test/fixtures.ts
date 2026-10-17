import { crearReporte } from "@/domain/reportes";
import type { NuevoReporteInput, Reporte } from "@/types";

/** Datos de prueba compartidos por las pruebas de dominio y de adaptadores (todos ficticios). */

export const FECHA_BASE = "2026-10-17T12:00:00.000Z";

/** Centro de Mérida (Plaza Grande, aproximado). */
export const CENTRO = { lat: 20.9674, lng: -89.6243 } as const;

export function entradaReporte(sobrescribir: Partial<NuevoReporteInput> = {}): NuevoReporteInput {
  return {
    categoria: "bache",
    descripcion: "  Bache grande en el carril derecho, frente a la tienda.  ",
    ubicacion: { ...CENTRO, referencia: " Calle 60 x 59 y 61 ", colonia: "Centro", origen: "manual" },
    tieneFoto: false,
    riesgoDeclarado: false,
    ...sobrescribir,
  };
}

export function reporteDemo(
  sobrescribir: Partial<NuevoReporteInput> = {},
  datos: { id?: string; folio?: string; identidadId?: string; fecha?: string } = {},
): Reporte {
  return crearReporte(entradaReporte(sobrescribir), {
    id: datos.id ?? "rep-1",
    folio: datos.folio ?? "DEMO-R-0000001",
    identidadId: datos.identidadId ?? "ana",
    fecha: datos.fecha ?? FECHA_BASE,
  });
}
