/** Idioma en que responde el asistente. «yua» = maya yucateco (ISO 639-3). */
import { z } from "zod";

export const IDIOMAS_ASISTENTE = ["es", "yua"] as const;
export const IdiomaAsistenteSchema = z.enum(IDIOMAS_ASISTENTE);
export type IdiomaAsistente = z.infer<typeof IdiomaAsistenteSchema>;
