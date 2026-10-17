import type { LineaAyuda } from "@/types";

/**
 * Lógica pura de presentación de las líneas de ayuda humana (sin DOM ni datos propios: las líneas
 * llegan de useHelpLines, que lee LINEAS_AYUDA verificadas).
 */

/** Para quién se ordena la hoja: el 911 siempre va primero; después, lo más relevante. */
export type EnfoqueAyuda = "general" | "salud_mental" | "violencia";

/** Número nacional de emergencias. Único dato propio: respaldo si las líneas no cargan. */
export const NUMERO_EMERGENCIAS = "911";

export const ETIQUETA_AMBITO: Readonly<Record<LineaAyuda["ambito"], string>> = {
  municipal: "Municipal",
  estatal: "Estatal",
  nacional: "Nacional",
};

export interface GruposLineas {
  /** 911 (siempre primero). */
  emergencias: LineaAyuda[];
  /** Líneas de apoyo a personas: violencia contra las mujeres y salud mental. */
  apoyo: LineaAyuda[];
  /** Otros contactos municipales (orientación, protección civil). */
  otras: LineaAyuda[];
}

export function esEmergencias911(linea: Pick<LineaAyuda, "telefonoMarcable">): boolean {
  return linea.telefonoMarcable.replace(/\D/g, "") === NUMERO_EMERGENCIAS;
}

const PRIORIDAD_APOYO: Readonly<Record<EnfoqueAyuda, readonly LineaAyuda["tipo"][]>> = {
  general: [],
  salud_mental: ["salud_mental", "violencia"],
  violencia: ["violencia", "salud_mental"],
};

/** Orden estable: por tipo según el enfoque y, a igualdad, en el orden de la fuente. */
function ordenarPorEnfoque(lineas: LineaAyuda[], enfoque: EnfoqueAyuda): LineaAyuda[] {
  const prioridad = PRIORIDAD_APOYO[enfoque];
  if (prioridad.length === 0) return lineas;
  const peso = (linea: LineaAyuda) => {
    const indice = prioridad.indexOf(linea.tipo);
    return indice === -1 ? prioridad.length : indice;
  };
  return lineas
    .map((linea, indice) => ({ linea, indice }))
    .sort((a, b) => peso(a.linea) - peso(b.linea) || a.indice - b.indice)
    .map(({ linea }) => linea);
}

/** Agrupa las líneas: 911 primero, luego apoyo (según el enfoque) y otros contactos. */
export function agruparLineas(lineas: readonly LineaAyuda[], enfoque: EnfoqueAyuda = "general"): GruposLineas {
  const emergencias = lineas.filter(esEmergencias911);
  const resto = lineas.filter((linea) => !esEmergencias911(linea));
  const apoyo = resto.filter((linea) => linea.tipo === "salud_mental" || linea.tipo === "violencia");
  const otras = resto.filter((linea) => linea.tipo !== "salud_mental" && linea.tipo !== "violencia");
  return { emergencias, apoyo: ordenarPorEnfoque(apoyo, enfoque), otras };
}

/** Lista plana en el orden en que se muestran. */
export function ordenarLineas(lineas: readonly LineaAyuda[], enfoque: EnfoqueAyuda = "general"): LineaAyuda[] {
  const { emergencias, apoyo, otras } = agruparLineas(lineas, enfoque);
  return [...emergencias, ...apoyo, ...otras];
}

/** Enlace tel: con sólo dígitos, comas (pausa) y «+». */
export function hrefTelefono(telefonoMarcable: string): string {
  return `tel:${telefonoMarcable.replace(/[^\d+,]/g, "")}`;
}
