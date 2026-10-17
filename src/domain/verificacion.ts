import type {
  CalidadVerificacion,
  EstadoVerificacionCiudadana,
  ReglasPuntosDemo,
  Reporte,
  ResultadoVerificacion,
  Verificacion,
} from "@/types";

/**
 * Verificación ciudadana (propuesta del prototipo; no existe en Mérida Móvil).
 *
 * - Sólo se verifica un reporte con atención reportada ("solucionado"), que no sea propio, y una sola
 *   vez por identidad y reporte.
 * - Se premia la CALIDAD (comentario útil, ubicación confirmada, evidencia), no que la respuesta sea
 *   positiva: "reparación completada" y "el problema persiste" valen lo mismo con la misma calidad.
 * - El estado agregado se calcula sólo con verificaciones APROBADAS por el operador. Una que dice que
 *   el problema persiste deja el reporte en "discrepancia" sin cerrar ni reabrir nada.
 */

export type MotivoNoElegible = "no_solucionado" | "reporte_propio" | "ya_verificado";

export type Elegibilidad = { elegible: true } | { elegible: false; codigo: MotivoNoElegible; motivo: string };

export const ETIQUETA_RESULTADO: Record<ResultadoVerificacion, string> = {
  reparacion_completada: "La reparación parece completada",
  problema_persiste: "El problema persiste",
  no_puedo_comprobar: "No pude comprobarlo",
};

export function evaluarElegibilidad(
  reporte: Pick<Reporte, "id" | "estadoMunicipal" | "identidadId">,
  identidadId: string,
  verificaciones: readonly Pick<Verificacion, "reporteId" | "identidadId">[],
): Elegibilidad {
  if (reporte.identidadId === identidadId) {
    return { elegible: false, codigo: "reporte_propio", motivo: "No puedes verificar un reporte que tú hiciste." };
  }
  if (reporte.estadoMunicipal !== "solucionado") {
    return {
      elegible: false,
      codigo: "no_solucionado",
      motivo: "Sólo se pueden verificar reportes con atención reportada por el Ayuntamiento.",
    };
  }
  if (verificaciones.some((v) => v.reporteId === reporte.id && v.identidadId === identidadId)) {
    return { elegible: false, codigo: "ya_verificado", motivo: "Ya enviaste una verificación para este reporte." };
  }
  return { elegible: true };
}

export function evaluarCalidad(
  input: { comentario: string; ubicacionConfirmada: boolean; tieneFoto: boolean },
  reglas: Pick<ReglasPuntosDemo, "longitudMinimaComentario">,
): CalidadVerificacion {
  return {
    descripcionUtil: input.comentario.trim().length >= reglas.longitudMinimaComentario,
    ubicacionConfirmada: input.ubicacionConfirmada,
    evidencia: input.tieneFoto,
  };
}

export function criteriosCumplidos(calidad: CalidadVerificacion): number {
  return Number(calidad.descripcionUtil) + Number(calidad.ubicacionConfirmada) + Number(calidad.evidencia);
}

/**
 * Puntos de una verificación aprobada. No depende de que la respuesta sea positiva:
 * completada y persiste usan la misma fórmula; "no pude comprobarlo" vale lo que diga la regla.
 */
export function calcularPuntosVerificacion(
  resultado: ResultadoVerificacion,
  calidad: CalidadVerificacion,
  reglas: Pick<ReglasPuntosDemo, "verificacionBase" | "verificacionBonoCalidad" | "verificacionNoConcluyente">,
): number {
  if (resultado === "no_puedo_comprobar") return reglas.verificacionNoConcluyente;
  return reglas.verificacionBase + reglas.verificacionBonoCalidad * criteriosCumplidos(calidad);
}

export function claveEventoVerificacion(verificacionId: string): string {
  return `verificacion:${verificacionId}:aprobada`;
}

/** Estado de verificación ciudadana del reporte a partir de las verificaciones APROBADAS. */
export function estadoVerificacionAgregado(
  reporte: Pick<Reporte, "id" | "estadoMunicipal">,
  verificaciones: readonly Pick<Verificacion, "reporteId" | "estadoRevision" | "resultado">[],
): EstadoVerificacionCiudadana {
  if (reporte.estadoMunicipal !== "solucionado") return "no_aplica";
  const aprobadas = verificaciones.filter((v) => v.reporteId === reporte.id && v.estadoRevision === "aprobada");
  if (aprobadas.length === 0) return "pendiente";
  if (aprobadas.some((v) => v.resultado === "problema_persiste")) return "discrepancia";
  if (aprobadas.some((v) => v.resultado === "reparacion_completada")) return "coincide";
  return "no_concluyente";
}
