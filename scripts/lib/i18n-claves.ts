/** Extracción de claves de traducción del código fuente (t("…") y msg("…")) y utilidades compartidas. */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export const RAIZ_SRC = "src";
export const CARPETA_YUA = "src/i18n/locales/yua";

export function archivosFuente(carpeta: string, salida: string[] = []): string[] {
  for (const nombre of readdirSync(carpeta)) {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) {
      if (nombre === "node_modules" || nombre === "i18n" || nombre === "test") continue;
      archivosFuente(ruta, salida);
    } else if (/\.tsx?$/.test(nombre) && !/\.test\.tsx?$/.test(nombre)) salida.push(ruta);
  }
  return salida;
}

const PATRON = /\b(?:t|msg)\(\s*(?:"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`([^`$\\\n]*)`)/g;

export function extraerClaves(codigo: string): string[] {
  const claves: string[] = [];
  for (const coincidencia of codigo.matchAll(PATRON)) {
    const bruta = coincidencia[1] ?? coincidencia[2] ?? coincidencia[3] ?? "";
    const clave = bruta.replace(/\\(["'`\\])/g, "$1").replace(/\\n/g, "\n");
    if (clave.trim()) claves.push(clave);
  }
  return claves;
}

export const marcadores = (texto: string): string => [...texto.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort().join(",");

/** Nombre del archivo de traducción de un archivo fuente: features/reports → reports.json. */
export function modulo(archivo: string): string {
  const partes = archivo.split("/");
  if (partes[1] === "features" && partes[2]) return partes[2];
  return partes[1] ?? "comun";
}

/** clave → archivo donde aparece por primera vez. */
export function clavesDelCodigo(filtro?: string): Map<string, string> {
  const claves = new Map<string, string>();
  for (const archivo of archivosFuente(RAIZ_SRC)) {
    if (filtro && !archivo.startsWith(filtro)) continue;
    for (const clave of extraerClaves(readFileSync(archivo, "utf8"))) if (!claves.has(clave)) claves.set(clave, archivo);
  }
  return claves;
}

/** Todas las traducciones al maya ya escritas (clave → maya). */
export function traduccionesMaya(): Map<string, string> {
  const traducciones = new Map<string, string>();
  for (const nombre of readdirSync(CARPETA_YUA).filter((n) => n.endsWith(".json"))) {
    const datos = JSON.parse(readFileSync(join(CARPETA_YUA, nombre), "utf8")) as Record<string, string>;
    for (const [clave, valor] of Object.entries(datos)) traducciones.set(clave, valor);
  }
  return traducciones;
}
