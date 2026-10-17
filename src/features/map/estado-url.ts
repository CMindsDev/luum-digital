import { CATEGORIAS_REPORTE, esCategoriaReporte } from "@/domain/reportes";
import type { CategoriaReporte, EstadoMunicipal } from "@/types";

/**
 * Estado del Visor Urbano en la URL (?vista=…&capa=…&categoria=…&estado=…). Así, al abrir el
 * detalle de un reporte y regresar, el mapa conserva vista, representación y filtros, y el asistente
 * puede abrirlo ya filtrado (acción «abrirMapa»: categoria, vista puntos|calor|celdas|lista, reporte).
 */

export type ModoVista = "mapa" | "lista";
export type Representacion = "puntos" | "calor" | "celdas";
export type ResolucionZonas = 8 | 9;

export interface EstadoVisor {
  vista: ModoVista;
  /** Cómo se dibujan las incidencias en el mapa. */
  capa: Representacion;
  /** Resolución H3 de las zonas: 8 = ciudad, 9 = colonia. */
  resolucion: ResolucionZonas;
  categorias: CategoriaReporte[];
  estados: EstadoMunicipal[];
  /** Incidencia abierta en el panel. */
  reporteId: string | null;
  /** Capa de demanda de bienestar agregada (sólo operador/administración). */
  bienestar: boolean;
}

export const ESTADO_VISOR_INICIAL: EstadoVisor = {
  vista: "mapa",
  capa: "puntos",
  resolucion: 8,
  categorias: [],
  estados: [],
  reporteId: null,
  bienestar: false,
};

export const ESTADOS_MUNICIPALES: readonly EstadoMunicipal[] = ["registrado", "en_proceso", "solucionado", "cancelado"];

const REPRESENTACIONES: readonly Representacion[] = ["puntos", "calor", "celdas"];

function esEstadoMunicipal(valor: string): valor is EstadoMunicipal {
  return (ESTADOS_MUNICIPALES as readonly string[]).includes(valor);
}

function esRepresentacion(valor: string): valor is Representacion {
  return (REPRESENTACIONES as readonly string[]).includes(valor);
}

/** Valores repetidos o separados por comas, sin duplicados, en el orden canónico. */
function leerLista<T extends string>(valores: string[], valido: (valor: string) => valor is T, orden: readonly T[]): T[] {
  const elegidos = new Set<T>();
  for (const valor of valores.flatMap((v) => v.split(","))) {
    const limpio = valor.trim();
    if (valido(limpio)) elegidos.add(limpio);
  }
  return orden.filter((valor) => elegidos.has(valor));
}

const ID_REPORTE = /^[A-Za-z0-9_-]{1,60}$/;

export function leerEstadoVisor(parametros: URLSearchParams): EstadoVisor {
  const vistaCruda = parametros.get("vista") ?? "";
  const capaCruda = parametros.get("capa") ?? "";
  // El asistente usa vista=puntos|calor|celdas|lista: las tres primeras son el mapa con esa capa.
  const vista: ModoVista = vistaCruda === "lista" ? "lista" : "mapa";
  const capa: Representacion = esRepresentacion(vistaCruda) ? vistaCruda : esRepresentacion(capaCruda) ? capaCruda : ESTADO_VISOR_INICIAL.capa;
  const reporte = parametros.get("reporte");
  return {
    vista,
    capa,
    resolucion: parametros.get("res") === "9" ? 9 : 8,
    categorias: leerLista(parametros.getAll("categoria"), esCategoriaReporte, CATEGORIAS_REPORTE),
    estados: leerLista(parametros.getAll("estado"), esEstadoMunicipal, ESTADOS_MUNICIPALES),
    reporteId: reporte && ID_REPORTE.test(reporte) ? reporte : null,
    bienestar: parametros.get("bienestar") === "1",
  };
}

/** Escribe sólo lo que difiere del estado inicial (URLs cortas y estables). */
export function escribirEstadoVisor(estado: EstadoVisor): URLSearchParams {
  const parametros = new URLSearchParams();
  if (estado.vista !== ESTADO_VISOR_INICIAL.vista) parametros.set("vista", estado.vista);
  if (estado.capa !== ESTADO_VISOR_INICIAL.capa) parametros.set("capa", estado.capa);
  if (estado.resolucion !== ESTADO_VISOR_INICIAL.resolucion) parametros.set("res", String(estado.resolucion));
  for (const categoria of CATEGORIAS_REPORTE) if (estado.categorias.includes(categoria)) parametros.append("categoria", categoria);
  for (const valor of ESTADOS_MUNICIPALES) if (estado.estados.includes(valor)) parametros.append("estado", valor);
  if (estado.reporteId) parametros.set("reporte", estado.reporteId);
  if (estado.bienestar) parametros.set("bienestar", "1");
  return parametros;
}

/** Alterna un valor dentro de una lista (para los filtros conmutables). */
export function alternar<T>(lista: readonly T[], valor: T, activo: boolean): T[] {
  const sin = lista.filter((elemento) => elemento !== valor);
  return activo ? [...sin, valor] : sin;
}

export function filtrosActivos(estado: Pick<EstadoVisor, "categorias" | "estados">): number {
  return estado.categorias.length + estado.estados.length;
}
