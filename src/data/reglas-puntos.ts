import type { ReglasPuntosDemo } from "@/types";

/**
 * Reglas de puntos de la DEMOSTRACIÓN (propuesta del prototipo; no existe en Mérida Móvil).
 * Los valores son configurables aquí; la lógica está en src/domain/puntos.ts y src/domain/verificacion.ts.
 */
export const REGLAS_PUNTOS_DEMO: ReglasPuntosDemo = {
  etiqueta: "Reglas de demostración",
  reporteValidado: 40,
  verificacionBase: 15,
  verificacionBonoCalidad: 5,
  verificacionNoConcluyente: 10,
  longitudMinimaComentario: 20,
  aportacion: 0,
  descripcion: [
    "Reporte validado: 40 puntos. Se registran como pendientes al enviar y sólo se suman cuando el operador de demostración valida el reporte.",
    "Verificación aprobada: 15 puntos base más 5 por cada criterio de calidad (comentario útil de 20 caracteres o más, ubicación confirmada y foto de evidencia).",
    "«La reparación parece completada» y «El problema persiste» valen lo mismo con la misma calidad: se premia la calidad, no la respuesta positiva.",
    "«No pude comprobarlo»: 10 puntos si la verificación se aprueba.",
    "Aportar información a un reporte existente no da puntos: así no se premian duplicados.",
    "Nadie gana puntos por verificar su propio reporte y cada persona verifica un reporte una sola vez.",
    "Si un reporte se cancela, sus puntos pendientes se cancelan y los aprobados se revierten con motivo.",
    "Los puntos y la popularidad nunca deciden la prioridad de atención.",
    "Los canjes nunca dejan el saldo en negativo y los beneficios son ejemplos sin valor real.",
  ],
};
