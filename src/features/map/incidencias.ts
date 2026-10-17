import { cellToBoundary, cellToLatLng, latLngToCell } from "h3-js";
import type { ColeccionGeo, ElementoGeo, GeometriaPoligono, GeometriaPunto } from "@/components/mapa/tipos";
import { agregarEnCeldas } from "@/domain/demanda";
import { CATEGORIAS_REPORTE } from "@/domain/reportes";
import type { CategoriaReporte, CeldaDemanda, Coordenadas, EstadoMunicipal, Reporte, UbicacionServicio } from "@/types";
import { ESTADOS_MUNICIPALES } from "./estado-url";

/**
 * Lógica pura del Visor Urbano: filtros, conteos y GeoJSON (puntos de incidencias y celdas H3).
 * Las incidencias son datos de demostración. El conteo por zona describe demanda reportada; la
 * prioridad del servicio NO se decide por popularidad (src/domain/prioridad.ts).
 */

export interface FiltrosIncidencias {
  categorias: readonly CategoriaReporte[];
  estados: readonly EstadoMunicipal[];
}

export function filtrarIncidencias(reportes: readonly Reporte[], filtros: FiltrosIncidencias): Reporte[] {
  return reportes.filter(
    (reporte) =>
      (filtros.categorias.length === 0 || filtros.categorias.includes(reporte.categoria)) &&
      (filtros.estados.length === 0 || filtros.estados.includes(reporte.estadoMunicipal)),
  );
}

/** Cuántas incidencias habría al elegir cada categoría, respetando el filtro de estado vigente. */
/** Registro con cero para cada clave. */
function ceros<T extends string>(claves: readonly T[]): Record<T, number> {
  const conteo = {} as Record<T, number>;
  for (const clave of claves) conteo[clave] = 0;
  return conteo;
}

export function contarPorCategoria(reportes: readonly Reporte[], estados: readonly EstadoMunicipal[]): Record<CategoriaReporte, number> {
  const conteo = ceros(CATEGORIAS_REPORTE);
  for (const reporte of filtrarIncidencias(reportes, { categorias: [], estados })) conteo[reporte.categoria] += 1;
  return conteo;
}

/** Cuántas incidencias habría al elegir cada estado municipal, respetando el filtro de categoría vigente. */
export function contarPorEstado(reportes: readonly Reporte[], categorias: readonly CategoriaReporte[]): Record<EstadoMunicipal, number> {
  const conteo = ceros(ESTADOS_MUNICIPALES);
  for (const reporte of filtrarIncidencias(reportes, { categorias, estados: [] })) conteo[reporte.estadoMunicipal] += 1;
  return conteo;
}

export type PropiedadesIncidencia = {
  id: string;
  categoria: CategoriaReporte;
  estado: EstadoMunicipal;
  riesgo: boolean;
};

export function incidenciasAGeoJSON(reportes: readonly Reporte[]): ColeccionGeo<GeometriaPunto, PropiedadesIncidencia> {
  return {
    type: "FeatureCollection",
    features: reportes
      .filter((reporte) => Number.isFinite(reporte.ubicacion.lat) && Number.isFinite(reporte.ubicacion.lng))
      .map((reporte) => ({
        type: "Feature",
        id: reporte.id,
        geometry: { type: "Point", coordinates: [reporte.ubicacion.lng, reporte.ubicacion.lat] },
        properties: { id: reporte.id, categoria: reporte.categoria, estado: reporte.estadoMunicipal, riesgo: reporte.riesgoDeclarado },
      })),
  };
}

/** Celdas H3 con el conteo de incidencias (resolución 8 = ciudad, 9 = colonia). */
export function celdasDeIncidencias(reportes: readonly Reporte[], resolucion: number): CeldaDemanda[] {
  return agregarEnCeldas(
    reportes.map((reporte) => ({ lat: reporte.ubicacion.lat, lng: reporte.ubicacion.lng })),
    resolucion,
  );
}

export type PropiedadesCelda = {
  h3: string;
  conteo: number;
};

/** Polígonos GeoJSON de las celdas ([lng, lat], anillo cerrado). */
export function celdasAGeoJSON(celdas: readonly CeldaDemanda[]): ColeccionGeo<GeometriaPoligono, PropiedadesCelda> {
  return {
    type: "FeatureCollection",
    features: celdas.map((celda) => ({
      type: "Feature",
      id: celda.h3,
      geometry: { type: "Polygon", coordinates: [cellToBoundary(celda.h3, true).map(([lng, lat]): [number, number] => [lng, lat])] },
      properties: { h3: celda.h3, conteo: celda.conteo },
    })),
  };
}

/** Incidencias que caen en una celda H3. */
export function incidenciasEnCelda(reportes: readonly Reporte[], h3: string, resolucion: number): Reporte[] {
  return reportes.filter((reporte) => latLngToCell(reporte.ubicacion.lat, reporte.ubicacion.lng, resolucion) === h3);
}

/** Centro aproximado de una celda (para describirla sin mostrar identificadores técnicos). */
export function centroDeCelda(h3: string): Coordenadas {
  const [lat, lng] = cellToLatLng(h3);
  return { lat, lng };
}

/** Valor más alto de conteo (para escalar colores); 1 como mínimo. */
export function conteoMaximo(celdas: readonly CeldaDemanda[]): number {
  return Math.max(1, ...celdas.map((celda) => celda.conteo));
}

/** Separa las ubicaciones de atención que publican coordenadas (mapa) de las que sólo tienen dirección (lista). */
export function separarUbicaciones(ubicaciones: readonly UbicacionServicio[]): {
  conCoordenadas: UbicacionServicio[];
  sinCoordenadas: UbicacionServicio[];
} {
  const conCoordenadas: UbicacionServicio[] = [];
  const sinCoordenadas: UbicacionServicio[] = [];
  for (const ubicacion of ubicaciones) {
    if (!ubicacion.verificado) continue;
    if (typeof ubicacion.lat === "number" && typeof ubicacion.lng === "number") conCoordenadas.push(ubicacion);
    else sinCoordenadas.push(ubicacion);
  }
  return { conCoordenadas, sinCoordenadas };
}

export type PropiedadesUbicacion = {
  id: string;
  nombre: string;
  tipo: UbicacionServicio["tipo"];
};

export function ubicacionesAGeoJSON(ubicaciones: readonly UbicacionServicio[]): ColeccionGeo<GeometriaPunto, PropiedadesUbicacion> {
  return {
    type: "FeatureCollection",
    features: ubicaciones.flatMap((ubicacion): ElementoGeo<GeometriaPunto, PropiedadesUbicacion>[] =>
      typeof ubicacion.lat === "number" && typeof ubicacion.lng === "number"
        ? [
            {
              type: "Feature",
              id: ubicacion.id,
              geometry: { type: "Point", coordinates: [ubicacion.lng, ubicacion.lat] },
              properties: { id: ubicacion.id, nombre: ubicacion.nombre, tipo: ubicacion.tipo },
            },
          ]
        : [],
    ),
  };
}
