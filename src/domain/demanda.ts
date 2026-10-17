import { latLngToCell } from "h3-js";
import type { CeldaDemanda, Coordenadas, DemandaAgregada } from "@/types";

/**
 * Agregación espacial en celdas H3 (estilo «zonas de alta demanda»).
 * Se usa para la demanda de bienestar (sólo operador/administración) y para la vista de celdas de
 * incidencias. Las celdas con menos registros que el umbral se ocultan y sólo se informa cuántas hubo.
 */

export const RESOLUCION_DEMANDA = 7;
export const UMBRAL_MINIMO_DEMANDA = 10;

export interface PuntoConteo extends Coordenadas {
  conteo?: number;
}

/** Agrupa puntos (o puntos con conteo) en celdas H3 de la resolución indicada. */
export function agregarEnCeldas(puntos: readonly PuntoConteo[], resolucion: number = RESOLUCION_DEMANDA): CeldaDemanda[] {
  const conteos = new Map<string, number>();
  for (const punto of puntos) {
    const celda = latLngToCell(punto.lat, punto.lng, resolucion);
    conteos.set(celda, (conteos.get(celda) ?? 0) + (punto.conteo ?? 1));
  }
  return [...conteos.entries()]
    .map(([h3, conteo]) => ({ h3, conteo, resolucion }))
    .sort((a, b) => b.conteo - a.conteo || a.h3.localeCompare(b.h3));
}

/** Oculta las celdas por debajo del umbral y cuenta cuántas se ocultaron. */
export function aplicarUmbral(celdas: readonly CeldaDemanda[], umbralMinimo: number): { visibles: CeldaDemanda[]; ocultas: number } {
  const visibles = celdas.filter((c) => c.conteo >= umbralMinimo);
  return { visibles, ocultas: celdas.length - visibles.length };
}

export function construirDemandaAgregada(
  puntos: readonly PuntoConteo[],
  opciones: { resolucion?: number; umbralMinimo?: number; leyenda: string },
): DemandaAgregada {
  const umbralMinimo = opciones.umbralMinimo ?? UMBRAL_MINIMO_DEMANDA;
  const { visibles, ocultas } = aplicarUmbral(agregarEnCeldas(puntos, opciones.resolucion ?? RESOLUCION_DEMANDA), umbralMinimo);
  return { celdas: visibles, umbralMinimo, celdasOcultas: ocultas, leyenda: opciones.leyenda };
}
