import { t } from "i18next";
import { z } from "zod";
import type { ReglasPuntosDemo } from "@/types";
import { CATEGORIAS_REPORTE } from "./reportes";

/**
 * Esquemas zod reutilizables por formularios y adaptadores (los adaptadores revalidan siempre).
 * Los límites de reporte siguen a «Reporta en línea»: descripción de 15 a 300 caracteres y foto
 * opcional de hasta 5 MB (el prototipo acepta además WebP).
 */

export const DESCRIPCION_REPORTE = { minimo: 15, maximo: 300 } as const;

export const TIPOS_FOTO_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"] as const;
export const TAMANO_MAXIMO_FOTO_BYTES = 5 * 1024 * 1024;

/** Límites aproximados del municipio de Mérida (incluye comisarías) para ubicar reportes. */
export const LIMITES_MERIDA = { latMin: 20.7, latMax: 21.2, lngMin: -89.9, lngMax: -89.4 } as const;

export const descripcionReporteSchema = z
  .string()
  .trim()
  .min(DESCRIPCION_REPORTE.minimo, {
    error: () => t("Describe el problema con al menos {{n}} caracteres.", { n: DESCRIPCION_REPORTE.minimo }),
  })
  .max(DESCRIPCION_REPORTE.maximo, {
    error: () => t("Usa como máximo {{n}} caracteres.", { n: DESCRIPCION_REPORTE.maximo }),
  });

export const referenciaUbicacionSchema = z
  .string()
  .trim()
  .min(5, { error: () => t("Escribe la calle y sus cruzamientos o una referencia.") })
  .max(160, { error: () => t("Usa como máximo 160 caracteres.") });

export const categoriaReporteSchema = z.enum(CATEGORIAS_REPORTE, {
  error: () => t("Elige el tipo de reporte."),
});

export const coordenadasMeridaSchema = z.object({
  lat: z
    .number({ error: () => t("Falta la ubicación.") })
    .min(LIMITES_MERIDA.latMin, { error: () => t("La ubicación está fuera del municipio de Mérida.") })
    .max(LIMITES_MERIDA.latMax, { error: () => t("La ubicación está fuera del municipio de Mérida.") }),
  lng: z
    .number({ error: () => t("Falta la ubicación.") })
    .min(LIMITES_MERIDA.lngMin, { error: () => t("La ubicación está fuera del municipio de Mérida.") })
    .max(LIMITES_MERIDA.lngMax, { error: () => t("La ubicación está fuera del municipio de Mérida.") }),
});

export const ubicacionSchema = coordenadasMeridaSchema.extend({
  referencia: referenciaUbicacionSchema,
  colonia: z.string().trim().max(80).optional(),
  origen: z.enum(["mapa", "manual", "dispositivo"]),
});

export const nuevoReporteSchema = z.object({
  categoria: categoriaReporteSchema,
  descripcion: descripcionReporteSchema,
  ubicacion: ubicacionSchema,
  tieneFoto: z.boolean(),
  riesgoDeclarado: z.boolean(),
});

export const aportacionSchema = z.object({
  descripcion: z
    .string()
    .trim()
    .min(DESCRIPCION_REPORTE.minimo, {
      error: () => t("Aporta al menos {{n}} caracteres.", { n: DESCRIPCION_REPORTE.minimo }),
    })
    .max(DESCRIPCION_REPORTE.maximo, {
      error: () => t("Usa como máximo {{n}} caracteres.", { n: DESCRIPCION_REPORTE.maximo }),
    }),
  tieneFoto: z.boolean(),
});

/** Archivo de foto: sólo tipo y tamaño (la foto nunca se persiste). */
export const fotoSchema = z.object({
  type: z.enum(TIPOS_FOTO_PERMITIDOS, { error: () => t("La foto debe ser JPG, PNG o WebP.") }),
  size: z.number().max(TAMANO_MAXIMO_FOTO_BYTES, { error: () => t("La foto no debe pesar más de 5 MB.") }),
});

/** Devuelve el mensaje de error de la foto o null si es válida. */
export function validarFoto(archivo: { type: string; size: number }): string | null {
  const resultado = fotoSchema.safeParse({ type: archivo.type, size: archivo.size });
  return resultado.success ? null : (resultado.error.issues[0]?.message ?? t("La foto no es válida."));
}

/** Teléfono ficticio de 10 dígitos (se permiten espacios al capturar). */
export const telefonoFicticioSchema = z
  .string()
  .transform((valor) => valor.replace(/\s+/g, ""))
  .pipe(z.string().regex(/^\d{10}$/, { error: () => t("Escribe un teléfono de 10 dígitos.") }));

export const correoSchema = z.email({ error: () => t("Escribe un correo válido.") });

export const codigoPostalSchema = z.string().trim().regex(/^\d{5}$/, { error: () => t("El código postal tiene 5 dígitos.") });

export const nombreCompletoSchema = z
  .string()
  .trim()
  .min(3, { error: () => t("Escribe el nombre completo.") })
  .max(120, { error: () => t("Usa como máximo 120 caracteres.") });

export const folioSchema = z
  .string()
  .trim()
  .min(1, { error: () => t("Escribe el folio.") })
  .max(24, { error: () => t("El folio es demasiado largo.") });

export function comentarioVerificacionSchema(reglas: Pick<ReglasPuntosDemo, "longitudMinimaComentario">) {
  return z
    .string()
    .trim()
    .max(DESCRIPCION_REPORTE.maximo, { error: () => t("Usa como máximo {{n}} caracteres.", { n: DESCRIPCION_REPORTE.maximo }) })
    .describe(t("Un comentario de {{n}} caracteres o más cuenta como descripción útil.", { n: reglas.longitudMinimaComentario }));
}

export const nuevaVerificacionSchema = z.object({
  reporteId: z.string().min(1),
  resultado: z.enum(["reparacion_completada", "problema_persiste", "no_puedo_comprobar"], {
    error: () => t("Elige lo que observaste."),
  }),
  comentario: z.string().trim().max(DESCRIPCION_REPORTE.maximo, {
    error: () => t("Usa como máximo {{n}} caracteres.", { n: DESCRIPCION_REPORTE.maximo }),
  }),
  ubicacionConfirmada: z.boolean(),
  tieneFoto: z.boolean(),
});

export const motivoObligatorioSchema = z
  .string()
  .trim()
  .min(5, { error: () => t("Escribe el motivo (al menos 5 caracteres).") })
  .max(200, { error: () => t("Usa como máximo 200 caracteres.") });

/** Primer mensaje de error legible de un resultado zod. */
export function primerError(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue?.message ?? t("Revisa los datos.");
}
