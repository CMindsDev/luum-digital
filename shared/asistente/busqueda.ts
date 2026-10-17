/**
 * Contrato de la búsqueda inteligente (/buscar): respuesta breve con citas numeradas, generada SOLO a
 * partir de pasajes verificados, más la intención que detecta Clef. Compartido por navegador y servidor.
 */
import { z } from "zod";
import { CATEGORIAS_INTENCION, MODOS_GUARDAS } from "./servidor";
import { PasajeSchema } from "./conocimiento";
import { IdiomaAsistenteSchema } from "./idioma";

export const LIMITES_BUSQUEDA = { consultaMin: 2, consultaMax: 160, respuestaMax: 1200, citasMax: 6, pasajesMax: 3 } as const;

export const SolicitudBusquedaSchema = z.object({
  consulta: z.string().trim().min(LIMITES_BUSQUEDA.consultaMin).max(LIMITES_BUSQUEDA.consultaMax),
  /** Idioma de la respuesta redactada (por omisión, español). */
  idioma: IdiomaAsistenteSchema.optional(),
});
export type SolicitudBusqueda = z.infer<typeof SolicitudBusquedaSchema>;

/** Fuente numerada: el [n] del texto de la respuesta remite a esta cita. */
export const CitaSchema = z.object({
  n: z.number().int().min(1).max(LIMITES_BUSQUEDA.citasMax),
  titulo: z.string().min(1).max(500),
  url: z.string().max(400).optional(),
  /** Ruta interna de la app donde se ve la fuente (p. ej. la ficha del trámite). */
  ruta: z.string().max(200).optional(),
  fechaConsulta: z.string().max(20).optional(),
});
export type Cita = z.infer<typeof CitaSchema>;

export const RespuestaBusquedaSchema = z.object({
  /** Texto breve con marcadores [1], [2]… ; null si no hay información suficiente. */
  respuesta: z.string().max(LIMITES_BUSQUEDA.respuestaMax).nullable(),
  /** true si la redactó un modelo de IA a partir de los pasajes; false si no hubo redacción. */
  generada: z.boolean(),
  citas: z.array(CitaSchema).max(LIMITES_BUSQUEDA.citasMax),
  /** Coincidencias relacionadas (tarjetas «Información relacionada»). */
  pasajes: z.array(PasajeSchema).max(LIMITES_BUSQUEDA.pasajesMax),
  /** Intención que detectó Clef (null si Clef no está disponible). */
  intencion: z.object({ categoria: z.enum(CATEGORIAS_INTENCION).nullable(), modo: z.enum(MODOS_GUARDAS) }),
});
export type RespuestaBusqueda = z.infer<typeof RespuestaBusquedaSchema>;
