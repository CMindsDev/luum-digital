/** Carga el conocimiento generado por scripts/construir-conocimiento.ts (data/conocimiento/). */
import { existsSync, readFileSync } from "node:fs";
import { z } from "zod";
import { PasajeSchema } from "../../shared/asistente/conocimiento";
import type { Registrador } from "../registro";
import { crearEmbedder } from "./embeddings";
import { crearIndiceConocimiento, type IndiceConocimiento } from "./indice";
import { MODELO_EMBEDDING, DIMENSIONES_EMBEDDING, type ArchivoVectores } from "./vectores";

const CARPETA = new URL("../../data/conocimiento/", import.meta.url);

const ArchivoVectoresSchema = z.object({
  modelo: z.string(),
  dimensiones: z.number().int().positive(),
  ids: z.array(z.string()),
  datos: z.string(),
});

export function indiceVacio(): IndiceConocimiento {
  return crearIndiceConocimiento({ pasajes: [] });
}

export function cargarIndiceConocimiento(opciones: { apiKey: string | null; fetch?: typeof fetch; registrar?: Registrador }): IndiceConocimiento {
  const archivoCorpus = new URL("corpus.json", CARPETA);
  if (!existsSync(archivoCorpus)) {
    opciones.registrar?.("conocimiento_sin_corpus", {});
    return indiceVacio();
  }
  const pasajes = z.array(PasajeSchema).parse(JSON.parse(readFileSync(archivoCorpus, "utf8")));

  let vectores: ArchivoVectores | null = null;
  const archivoVectores = new URL("vectores.json", CARPETA);
  if (existsSync(archivoVectores)) {
    const leido = ArchivoVectoresSchema.safeParse(JSON.parse(readFileSync(archivoVectores, "utf8")));
    // Sólo se usan vectores del mismo modelo y tamaño con el que se consulta.
    if (leido.success && leido.data.modelo === MODELO_EMBEDDING && leido.data.dimensiones === DIMENSIONES_EMBEDDING) vectores = leido.data;
  }
  const embedder = opciones.apiKey && vectores ? crearEmbedder({ apiKey: opciones.apiKey, ...(opciones.fetch ? { fetch: opciones.fetch } : {}) }) : null;
  return crearIndiceConocimiento({ pasajes, vectores, embedder, ...(opciones.registrar ? { registrar: opciones.registrar } : {}) });
}
