import { esCategoriaId, esEstadoInformacion, esTipoRecorrido } from "@/components/catalogo";
import type { FiltroCatalogo } from "@/types";

/**
 * Filtros del catálogo en la URL (?q=&categoria=&info=&tipo=). Son datos públicos del catálogo,
 * nunca datos personales. Los valores desconocidos se ignoran.
 */
export const PARAMETROS_FILTRO = { texto: "q", categoria: "categoria", informacion: "info", tipo: "tipo" } as const;

export function leerFiltro(parametros: URLSearchParams): FiltroCatalogo {
  const filtro: FiltroCatalogo = {};
  const texto = parametros.get(PARAMETROS_FILTRO.texto)?.trim().slice(0, 120);
  if (texto) filtro.texto = texto;
  const categoria = parametros.get(PARAMETROS_FILTRO.categoria);
  if (esCategoriaId(categoria)) filtro.categoria = categoria;
  const informacion = parametros.get(PARAMETROS_FILTRO.informacion);
  if (esEstadoInformacion(informacion)) filtro.estadoDeInformacion = informacion;
  const tipo = parametros.get(PARAMETROS_FILTRO.tipo);
  if (esTipoRecorrido(tipo)) filtro.tipoDeRecorrido = tipo;
  return filtro;
}

/** Aplica cambios al filtro y devuelve los nuevos parámetros (conserva otros parámetros ajenos). */
export function escribirFiltro(actuales: URLSearchParams, cambios: Partial<Record<keyof FiltroCatalogo, string | undefined>>): URLSearchParams {
  const siguientes = new URLSearchParams(actuales);
  const pares: Array<[keyof FiltroCatalogo, string]> = [
    ["texto", PARAMETROS_FILTRO.texto],
    ["categoria", PARAMETROS_FILTRO.categoria],
    ["estadoDeInformacion", PARAMETROS_FILTRO.informacion],
    ["tipoDeRecorrido", PARAMETROS_FILTRO.tipo],
  ];
  for (const [clave, parametro] of pares) {
    if (!(clave in cambios)) continue;
    const valor = cambios[clave]?.trim();
    if (valor) siguientes.set(parametro, valor);
    else siguientes.delete(parametro);
  }
  return siguientes;
}

/** Cuántos filtros (además del texto) están activos. */
export function contarFiltros(filtro: FiltroCatalogo): number {
  return [filtro.categoria, filtro.estadoDeInformacion, filtro.tipoDeRecorrido].filter(Boolean).length;
}

export function hayBusqueda(filtro: FiltroCatalogo): boolean {
  return Boolean(filtro.texto) || contarFiltros(filtro) > 0;
}

/**
 * Divide un nombre de categoría en dos líneas para el encabezado temático del Laboratorio
 * (línea sans + línea serif itálica): «Pagos y» / «contribuciones», «Atención» / «ciudadana».
 */
export function lineasTitulo(nombre: string): [string, string | null] {
  const limpio = nombre.trim().replace(/\s+/g, " ");
  const conY = /^(.+? y)\s+(.+)$/.exec(limpio);
  if (conY?.[1] && conY[2]) return [conY[1], conY[2]];
  const palabras = limpio.split(" ");
  if (palabras.length < 2) return [limpio, null];
  return [palabras.slice(0, -1).join(" "), palabras[palabras.length - 1] ?? null];
}
