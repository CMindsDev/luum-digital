import type { FieldErrors, Resolver } from "react-hook-form";
import { z } from "zod";
import { CATEGORIAS_REPORTE } from "@/domain/reportes";
import { LIMITES_MERIDA, descripcionReporteSchema, referenciaUbicacionSchema } from "@/domain/validaciones";
import type { CategoriaReporte } from "@/types";
import { coloniaMencionada } from "./colonias";
import type { PrefillReporte } from "./prefill";
import type { CamposUbicacion } from "./ubicacion";

export type PasoReporte = "descripcion" | "ubicacion" | "foto" | "coincidencias" | "revision";

/**
 * Valores del formulario «Nuevo reporte». `paso` es el paso visible (estado de interfaz dentro del
 * mismo formulario: el resolver valida sólo ese paso). La foto vive aparte y nunca se persiste.
 */
export interface ValoresReporte extends CamposUbicacion {
  paso: PasoReporte;
  categoria: CategoriaReporte | "";
  descripcion: string;
  riesgoDeclarado: boolean;
}

export const ORDEN_PASOS: readonly PasoReporte[] = ["descripcion", "ubicacion", "foto", "coincidencias", "revision"];

export const DEFINICION_PASO: Record<PasoReporte, { titulo: string; encabezado: string }> = {
  descripcion: { titulo: "Describe", encabezado: "Describe la incidencia" },
  ubicacion: { titulo: "Ubicación", encabezado: "Confirma la ubicación" },
  foto: { titulo: "Foto", encabezado: "Agrega una fotografía (opcional)" },
  coincidencias: { titulo: "Coincidencias", encabezado: "Revisa si ya lo reportaron" },
  revision: { titulo: "Revisa y envía", encabezado: "Revisa tu reporte" },
};

/** Paso anterior (o null en el primero). */
export function pasoAnterior(paso: PasoReporte): PasoReporte | null {
  return ORDEN_PASOS[ORDEN_PASOS.indexOf(paso) - 1] ?? null;
}

export const LIMITES_CAMPOS = { calle: 40, cruzamiento: 25, referenciaAdicional: 50, referenciaMapa: 160 } as const;

/**
 * Interpreta una referencia libre del asistente («calle 60 x 59 y 61 del Centro»): calle,
 * cruzamientos y colonia si se reconocen. Lo que no se reconoce queda como referencia adicional.
 */
export function interpretarReferencia(referencia: string): Pick<ValoresReporte, "coloniaId" | "calle" | "cruzamiento1" | "cruzamiento2" | "referenciaAdicional"> {
  const texto = referencia.trim();
  const colonia = texto ? coloniaMencionada(texto) : undefined;
  const calle = /\bcalle\s+(\d{1,3}(?:-?[a-z])?)\b/i.exec(texto)?.[1] ?? "";
  const cruces = /\b(?:x|por|entre)\s+(\d{1,3}(?:-?[a-z])?)(?:\s+(?:y|e)\s+(\d{1,3}(?:-?[a-z])?))?/i.exec(texto);
  return {
    coloniaId: colonia?.id ?? "",
    calle,
    cruzamiento1: cruces?.[1] ?? "",
    cruzamiento2: cruces?.[2] ?? "",
    referenciaAdicional: calle ? "" : texto.slice(0, LIMITES_CAMPOS.referenciaAdicional),
  };
}

export function valoresIniciales(categoria: CategoriaReporte, prefill: PrefillReporte | null): ValoresReporte {
  const referencia = prefill?.referenciaUbicacion ?? "";
  return {
    paso: "descripcion",
    categoria,
    descripcion: prefill?.descripcion ?? "",
    riesgoDeclarado: false,
    modoUbicacion: "manual",
    ...interpretarReferencia(referencia),
    referenciaMapa: referencia,
    lat: null,
    lng: null,
    origenCoordenadas: "mapa",
  };
}

const textoMaximo = (maximo: number) => z.string().trim().max(maximo, `Usa como máximo ${maximo} caracteres.`);

const esquemaDescripcion = z.object({
  categoria: z.enum(CATEGORIAS_REPORTE, { error: "Elige el tipo de reporte." }),
  descripcion: descripcionReporteSchema,
});

const esquemaUbicacionManual = z.object({
  coloniaId: z.string().min(1, "Elige la colonia o comisaría."),
  calle: textoMaximo(LIMITES_CAMPOS.calle).min(1, "Escribe la calle (por ejemplo, 60)."),
  cruzamiento1: textoMaximo(LIMITES_CAMPOS.cruzamiento).min(1, "Escribe al menos un cruzamiento."),
  cruzamiento2: textoMaximo(LIMITES_CAMPOS.cruzamiento),
  referenciaAdicional: textoMaximo(LIMITES_CAMPOS.referenciaAdicional),
});

const MENSAJE_SIN_PUNTO = "Marca el punto en el mapa o usa la ubicación de tu dispositivo.";
const MENSAJE_FUERA = "La ubicación está fuera del municipio de Mérida.";

const esquemaUbicacionMapa = z.object({
  lat: z
    .number({ error: MENSAJE_SIN_PUNTO })
    .min(LIMITES_MERIDA.latMin, MENSAJE_FUERA)
    .max(LIMITES_MERIDA.latMax, MENSAJE_FUERA),
  lng: z
    .number({ error: MENSAJE_SIN_PUNTO })
    .min(LIMITES_MERIDA.lngMin, MENSAJE_FUERA)
    .max(LIMITES_MERIDA.lngMax, MENSAJE_FUERA),
  referenciaMapa: referenciaUbicacionSchema,
});

const sinCampos = z.object({});

/** Esquema del paso actual: cada paso valida sólo sus campos. */
export function esquemaDelPaso(paso: PasoReporte, modoUbicacion: ValoresReporte["modoUbicacion"]): z.ZodType {
  if (paso === "descripcion") return esquemaDescripcion;
  if (paso === "ubicacion") return modoUbicacion === "manual" ? esquemaUbicacionManual : esquemaUbicacionMapa;
  return sinCampos;
}

const CAMPOS: ReadonlySet<string> = new Set<keyof ValoresReporte>([
  "paso",
  "categoria",
  "descripcion",
  "riesgoDeclarado",
  "modoUbicacion",
  "coloniaId",
  "calle",
  "cruzamiento1",
  "cruzamiento2",
  "referenciaAdicional",
  "referenciaMapa",
  "lat",
  "lng",
  "origenCoordenadas",
]);

function esCampo(valor: PropertyKey | undefined): valor is keyof ValoresReporte {
  return typeof valor === "string" && CAMPOS.has(valor);
}

/**
 * Resolver de React Hook Form que valida con zod sólo el paso visible (`valores.paso`).
 * Así «Continuar» enfoca el primer error del paso en pantalla.
 */
export const resolverReporte: Resolver<ValoresReporte> = async (valores) => {
  const resultado = esquemaDelPaso(valores.paso, valores.modoUbicacion).safeParse(valores);
  if (resultado.success) return { values: valores, errors: {} };
  const errores: FieldErrors<ValoresReporte> = {};
  for (const problema of resultado.error.issues) {
    const campo = problema.path[0];
    if (esCampo(campo) && !errores[campo]) {
      errores[campo] = { type: problema.code, message: problema.message };
    }
  }
  return { values: {}, errors: errores };
};
