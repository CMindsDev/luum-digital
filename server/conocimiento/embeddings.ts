/**
 * Cliente de embeddings de OpenAI (text-embedding-3-small, 512 dimensiones). Sólo en el servidor:
 * la clave nunca llega al navegador. Nunca registra el texto consultado.
 */
import { DIMENSIONES_EMBEDDING, MODELO_EMBEDDING, normalizarVector } from "./vectores";

const URL_EMBEDDINGS = "https://api.openai.com/v1/embeddings";

export type Embedder = (textos: readonly string[], opciones?: { timeoutMs?: number }) => Promise<Float32Array[]>;

export function crearEmbedder(opciones: { apiKey: string; fetch?: typeof fetch }): Embedder {
  const solicitar = opciones.fetch ?? fetch;
  return async (textos, { timeoutMs = 6_000 } = {}) => {
    const respuesta = await solicitar(URL_EMBEDDINGS, {
      method: "POST",
      headers: { Authorization: `Bearer ${opciones.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODELO_EMBEDDING, input: textos, dimensions: DIMENSIONES_EMBEDDING, encoding_format: "float" }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!respuesta.ok) throw new Error(`embeddings_${respuesta.status}`);
    const cuerpo: unknown = await respuesta.json();
    const datos = typeof cuerpo === "object" && cuerpo !== null ? Reflect.get(cuerpo, "data") : null;
    if (!Array.isArray(datos) || datos.length !== textos.length) throw new Error("embeddings_respuesta_invalida");
    const ordenados = [...datos].sort((a: unknown, b: unknown) => Number(Reflect.get(a as object, "index")) - Number(Reflect.get(b as object, "index")));
    return ordenados.map((elemento: unknown) => {
      const vector: unknown = typeof elemento === "object" && elemento !== null ? Reflect.get(elemento, "embedding") : null;
      if (!Array.isArray(vector)) throw new Error("embeddings_respuesta_invalida");
      return normalizarVector(vector.map(Number));
    });
  };
}
