/**
 * Contrato del conocimiento del asistente (RAG): pasajes verificables con su fuente.
 * Compartido por el navegador y el servidor; sin DOM ni Node.
 */
import { z } from "zod";

export const TIPOS_PASAJE = ["dependencia", "estructura", "servicio", "plataforma", "dato"] as const;
export type TipoPasaje = (typeof TIPOS_PASAJE)[number];

export const LIMITES_CONOCIMIENTO = {
  consultaMin: 2,
  consultaMax: 200,
  /** Pasajes que se devuelven por consulta. */
  maxPasajes: 5,
  /** Caracteres de cada pasaje que llegan al modelo. */
  maxCaracteresPasaje: 1400,
} as const;

export const FuentePasajeSchema = z.object({
  titulo: z.string().min(1).max(200),
  url: z.string().max(400).optional(),
  fechaConsulta: z.string().max(20).optional(),
});
export type FuentePasaje = z.infer<typeof FuentePasajeSchema>;

export const PasajeSchema = z.object({
  id: z.string().min(1).max(120),
  tipo: z.enum(TIPOS_PASAJE),
  titulo: z.string().min(1).max(500),
  texto: z.string().min(1).max(LIMITES_CONOCIMIENTO.maxCaracteresPasaje + 200),
  fuente: FuentePasajeSchema,
  /** Ruta interna de la app donde se ve este contenido (p. ej. la ficha del servicio). */
  ruta: z.string().max(200).optional(),
});
export type Pasaje = z.infer<typeof PasajeSchema>;

export const SolicitudConocimientoSchema = z.object({
  consulta: z.string().trim().min(LIMITES_CONOCIMIENTO.consultaMin).max(LIMITES_CONOCIMIENTO.consultaMax),
});
export type SolicitudConocimiento = z.infer<typeof SolicitudConocimientoSchema>;

export const RespuestaConocimientoSchema = z.object({
  pasajes: z.array(PasajeSchema).max(LIMITES_CONOCIMIENTO.maxPasajes),
  /** "hibrido" = vectores + palabras; "lexico" = sólo palabras (sin embeddings disponibles). */
  metodo: z.enum(["hibrido", "lexico"]),
});
export type RespuestaConocimiento = z.infer<typeof RespuestaConocimientoSchema>;
