import type { Ubicacion } from "@/types";
import { coloniaPorId } from "./colonias";

/** Campos de ubicación del formulario de reporte. */
export interface CamposUbicacion {
  modoUbicacion: "manual" | "mapa";
  coloniaId: string;
  calle: string;
  cruzamiento1: string;
  cruzamiento2: string;
  referenciaAdicional: string;
  referenciaMapa: string;
  lat: number | null;
  lng: number | null;
  origenCoordenadas: "mapa" | "dispositivo";
}

const PREFIJOS_VIA = /^(calle|c\.|av\.?|avenida|perif[eé]rico|circuito|carretera|prolongaci[oó]n|privada|andador|boulevard|blvd\.?)\b/i;

function limpiar(texto: string): string {
  return texto.trim().replace(/\s+/g, " ");
}

/** «60» → «Calle 60»; «Avenida Itzáes» se queda igual. */
export function nombrarVia(texto: string): string {
  const limpio = limpiar(texto);
  if (!limpio) return "";
  if (PREFIJOS_VIA.test(limpio)) return limpio.charAt(0).toUpperCase() + limpio.slice(1);
  return `Calle ${limpio}`;
}

/** Quita «calle» de los cruzamientos para escribirlos como en Mérida: «Calle 60 x 59 y 61». */
function nombrarCruce(texto: string): string {
  return limpiar(texto).replace(/^calle\s+/i, "");
}

/**
 * Referencia escrita como la usan en Mérida: «Calle 60 x 59 y 61, frente al parque».
 * La calle principal va antes de « x » para que la detección de duplicados la reconozca.
 */
export function componerReferencia(campos: Pick<CamposUbicacion, "calle" | "cruzamiento1" | "cruzamiento2" | "referenciaAdicional">): string {
  const via = nombrarVia(campos.calle);
  const cruce1 = nombrarCruce(campos.cruzamiento1);
  const cruce2 = nombrarCruce(campos.cruzamiento2);
  const adicional = limpiar(campos.referenciaAdicional);
  let referencia = via;
  if (cruce1 && cruce2) referencia += ` x ${cruce1} y ${cruce2}`;
  else if (cruce1 || cruce2) referencia += ` x ${cruce1 || cruce2}`;
  if (adicional) referencia += `, ${adicional}`;
  return referencia.slice(0, 160);
}

/**
 * Ubicación final del reporte a partir del formulario. Manual: centroide APROXIMADO de la colonia.
 * Mapa o dispositivo: las coordenadas marcadas. Devuelve null si falta información.
 */
export function componerUbicacion(campos: CamposUbicacion): Ubicacion | null {
  const colonia = campos.coloniaId ? coloniaPorId(campos.coloniaId) : undefined;
  if (campos.modoUbicacion === "manual") {
    if (!colonia || !limpiar(campos.calle)) return null;
    return {
      lat: colonia.lat,
      lng: colonia.lng,
      referencia: componerReferencia(campos),
      colonia: colonia.nombre,
      origen: "manual",
    };
  }
  if (campos.lat === null || campos.lng === null || !limpiar(campos.referenciaMapa)) return null;
  return {
    lat: campos.lat,
    lng: campos.lng,
    referencia: limpiar(campos.referenciaMapa).slice(0, 160),
    ...(colonia ? { colonia: colonia.nombre } : {}),
    origen: campos.origenCoordenadas,
  };
}

/** «20.96710, -89.62370». */
export function formatearCoordenadas(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
