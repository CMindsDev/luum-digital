import { z } from "zod";
import { folioSchema } from "@/domain/validaciones";
import type { EstadoMunicipal, FiltroReportes, Reporte } from "@/types";

/** Orden de los estatus en «Mis reportes» de Mérida Móvil. */
export const ORDEN_ESTADOS: readonly EstadoMunicipal[] = ["registrado", "en_proceso", "solucionado", "cancelado"];

export function agruparPorEstado(reportes: readonly Reporte[]): Record<EstadoMunicipal, Reporte[]> {
  const grupos: Record<EstadoMunicipal, Reporte[]> = { registrado: [], en_proceso: [], solucionado: [], cancelado: [] };
  for (const reporte of reportes) grupos[reporte.estadoMunicipal].push(reporte);
  return grupos;
}

export function contarPorEstado(reportes: readonly Reporte[]): Record<EstadoMunicipal, number> {
  const grupos = agruparPorEstado(reportes);
  return {
    registrado: grupos.registrado.length,
    en_proceso: grupos.en_proceso.length,
    solucionado: grupos.solucionado.length,
    cancelado: grupos.cancelado.length,
  };
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Filtros aplicados que viven en la URL (?desde=&hasta=&folio=) para poder volver o compartir. */
export interface FiltrosMisReportes {
  desde: string;
  hasta: string;
  folio: string;
}

export function leerFiltros(parametros: URLSearchParams): FiltrosMisReportes {
  const desde = parametros.get("desde") ?? "";
  const hasta = parametros.get("hasta") ?? "";
  return {
    desde: FECHA.test(desde) ? desde : "",
    hasta: FECHA.test(hasta) ? hasta : "",
    folio: (parametros.get("folio") ?? "").trim().slice(0, 24),
  };
}

export function escribirFiltros(filtros: FiltrosMisReportes): URLSearchParams {
  const parametros = new URLSearchParams();
  if (filtros.desde) parametros.set("desde", filtros.desde);
  if (filtros.hasta) parametros.set("hasta", filtros.hasta);
  if (filtros.folio) parametros.set("folio", filtros.folio);
  return parametros;
}

export function aFiltroReportes(filtros: FiltrosMisReportes, identidadId: string): FiltroReportes {
  return {
    identidadId,
    ...(filtros.desde ? { desde: filtros.desde } : {}),
    ...(filtros.hasta ? { hasta: filtros.hasta } : {}),
    ...(filtros.folio ? { folio: filtros.folio } : {}),
  };
}

/** «Fecha inicio» y «Fecha fin» (ambas opcionales; fin no puede ser anterior a inicio). */
export const filtroFechasSchema = z
  .object({
    desde: z.string().regex(FECHA, "Elige una fecha válida.").or(z.literal("")),
    hasta: z.string().regex(FECHA, "Elige una fecha válida.").or(z.literal("")),
  })
  .refine((valores) => !valores.desde || !valores.hasta || valores.hasta >= valores.desde, {
    path: ["hasta"],
    message: "La fecha fin debe ser igual o posterior a la fecha inicio.",
  });

export type ValoresFiltroFechas = z.infer<typeof filtroFechasSchema>;

export const busquedaFolioSchema = z.object({ folio: folioSchema });

export type ValoresBusquedaFolio = z.infer<typeof busquedaFolioSchema>;
