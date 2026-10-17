/**
 * Construye el conocimiento del asistente (RAG) a partir de las fuentes guardadas:
 *   - data/sources/dependencias/dependencias.html  (lista oficial de áreas municipales)
 *   - src/data/catalogo/servicios.generated.json   (catálogo de trámites y servicios)
 *   - docs/investigacion/2026-10-17/verify-datos-criticos.json (datos verificados con su cita textual)
 * Escribe data/conocimiento/corpus.json y, si hay OPENAI_API_KEY (en .env.local), data/conocimiento/vectores.json.
 *
 * Uso: npm run conocimiento:construir
 */
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { crearEmbedder } from "../server/conocimiento/embeddings";
import { construirPasajes, extraerAreas, leerHechos, leerServicios, textoParaEmbedding } from "../server/conocimiento/ingesta";
import { codificarVectores, DIMENSIONES_EMBEDDING, MODELO_EMBEDDING, type ArchivoVectores } from "../server/conocimiento/vectores";

const RUTA_HTML = "data/sources/dependencias/dependencias.html";
const RUTA_HECHOS = "docs/investigacion/2026-10-17/verify-datos-criticos.json";
const RUTA_SERVICIOS = "src/data/catalogo/servicios.generated.json";
const RUTA_CORPUS = "data/conocimiento/corpus.json";
const RUTA_VECTORES = "data/conocimiento/vectores.json";
const LOTE = 64;

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const html = readFileSync(RUTA_HTML, "utf8");
const areas = extraerAreas(html);
if (areas.length === 0) throw new Error("No se extrajo ninguna área de la página de dependencias.");
const servicios = leerServicios(JSON.parse(readFileSync(RUTA_SERVICIOS, "utf8")));
const fechaConsultaDependencias = statSync(RUTA_HTML).mtime.toISOString().slice(0, 10);

const hechos = leerHechos(JSON.parse(readFileSync(RUTA_HECHOS, "utf8")));
const pasajes = construirPasajes({ areas, servicios, fechaConsultaDependencias, hechos, fechaConsultaHechos: "2026-10-17" });
writeFileSync(RUTA_CORPUS, `${JSON.stringify(pasajes, null, 1)}\n`);
console.log(`Corpus: ${pasajes.length} pasajes (${areas.length} áreas, ${servicios.length} servicios, ${pasajes.filter((p) => p.tipo === "dato").length} datos verificados) → ${RUTA_CORPUS}`);

const apiKey = process.env.OPENAI_API_KEY?.trim();
if (!apiKey) {
  console.log("Sin OPENAI_API_KEY: no se generaron vectores (la búsqueda usará sólo palabras).");
} else {
  const embedder = crearEmbedder({ apiKey });
  const vectores: Float32Array[] = [];
  for (let i = 0; i < pasajes.length; i += LOTE) {
    const lote = pasajes.slice(i, i + LOTE).map(textoParaEmbedding);
    vectores.push(...(await embedder(lote, { timeoutMs: 60_000 })));
    console.log(`Embeddings ${Math.min(i + LOTE, pasajes.length)}/${pasajes.length}`);
  }
  const archivo: ArchivoVectores = { modelo: MODELO_EMBEDDING, dimensiones: DIMENSIONES_EMBEDDING, ids: pasajes.map((pasaje) => pasaje.id), datos: codificarVectores(vectores) };
  writeFileSync(RUTA_VECTORES, `${JSON.stringify(archivo)}\n`);
  console.log(`Vectores: ${vectores.length} × ${DIMENSIONES_EMBEDDING} (${MODELO_EMBEDDING}) → ${RUTA_VECTORES}`);
}
