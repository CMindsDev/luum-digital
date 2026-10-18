/**
 * Índice de conocimiento del asistente (RAG). Combina búsqueda por palabras (BM25) y por vectores
 * (embeddings de OpenAI precalculados) con fusión por rangos. Si no hay clave o falla la red, responde
 * sólo con palabras. Si ningún pasaje es suficientemente parecido, devuelve una lista VACÍA: el asistente
 * debe decir que no tiene esa información y no inventarla.
 */
import { LIMITES_CONOCIMIENTO, type Pasaje, type RespuestaConocimiento } from "../../shared/asistente/conocimiento";
import type { Registrador } from "../registro";
import type { Embedder } from "./embeddings";
import { crearIndiceLexico } from "./lexico";
import { normalizar } from "./texto";
import { coseno, decodificarVectores, type ArchivoVectores } from "./vectores";
import { preguntaPorPreferenciasDelAsistente } from "./alcance";

/** Por debajo de estos umbrales un pasaje no cuenta como relacionado con la consulta. */
export const UMBRALES = {
  /** Coseno mínimo (text-embedding-3-small, 512 dim). */
  coseno: 0.4,
  /** Puntaje BM25 mínimo cuando sólo hay palabras. */
  lexico: 3,
  /** Con vectores, una coincidencia de palabras sola debe ser claramente fuerte. */
  lexicoConVectores: 9,
} as const;

const K_FUSION = 60;

export interface IndiceConocimiento {
  readonly tamano: number;
  readonly conVectores: boolean;
  buscar(consulta: string): Promise<RespuestaConocimiento>;
}

export interface OpcionesIndice {
  pasajes: readonly Pasaje[];
  vectores?: ArchivoVectores | null;
  embedder?: Embedder | null;
  registrar?: Registrador;
}

export function crearIndiceConocimiento(opciones: OpcionesIndice): IndiceConocimiento {
  const { pasajes, embedder = null, registrar } = opciones;
  const lexico = crearIndiceLexico(pasajes);
  const porId = new Map(pasajes.map((pasaje) => [pasaje.id, pasaje]));

  let matriz: Map<string, Float32Array> | null = null;
  if (opciones.vectores) {
    try {
      const vectores = decodificarVectores(opciones.vectores);
      matriz = new Map(opciones.vectores.ids.map((id, indice) => [id, vectores[indice] as Float32Array]));
    } catch {
      registrar?.("conocimiento_vectores_invalidos", {});
    }
  }
  const conVectores = matriz !== null && embedder !== null;

  function rangos(puntajes: ReadonlyMap<string, number>): Map<string, number> {
    return new Map([...puntajes.entries()].sort((a, b) => b[1] - a[1]).map(([id], indice) => [id, indice + 1]));
  }

  return {
    tamano: pasajes.length,
    conVectores,
    async buscar(consulta) {
      if (preguntaPorPreferenciasDelAsistente(consulta)) return { pasajes: [], metodo: "lexico" };
      const puntosLexicos = lexico.puntuar(consulta);
      // «Cuántas…» pide un conteo: los pasajes de estructura ya lo traen hecho y deben ganar a una coincidencia suelta.
      if (/\bcuant/.test(normalizar(consulta))) {
        for (const [id, puntos] of puntosLexicos) if (id.startsWith("estructura:")) puntosLexicos.set(id, puntos * 1.8);
      }

      let cosenos: Map<string, number> | null = null;
      if (matriz && embedder) {
        try {
          const [vectorConsulta] = await embedder([consulta]);
          if (vectorConsulta) {
            cosenos = new Map();
            for (const [id, vector] of matriz) cosenos.set(id, coseno(vectorConsulta, vector));
          }
        } catch (error) {
          registrar?.("conocimiento_embedding_fallido", { tipo: error instanceof Error ? error.message.slice(0, 40) : "desconocido" });
        }
      }

      const umbralLexico = cosenos ? UMBRALES.lexicoConVectores : UMBRALES.lexico;
      const candidatos = new Set<string>();
      for (const [id, puntos] of puntosLexicos) if (puntos >= umbralLexico) candidatos.add(id);
      if (cosenos) for (const [id, valor] of cosenos) if (valor >= UMBRALES.coseno) candidatos.add(id);

      const rangoLexico = rangos(puntosLexicos);
      const rangoVector = cosenos ? rangos(cosenos) : null;
      const ordenados = [...candidatos]
        .map((id) => {
          const rl = rangoLexico.get(id);
          const rv = rangoVector?.get(id);
          const puntaje = (rl ? 1 / (K_FUSION + rl) : 0) + (rv ? 1 / (K_FUSION + rv) : 0);
          return { id, puntaje };
        })
        .sort((a, b) => b.puntaje - a.puntaje)
        .slice(0, LIMITES_CONOCIMIENTO.maxPasajes);

      const resultado: Pasaje[] = [];
      for (const { id } of ordenados) {
        const pasaje = porId.get(id);
        if (pasaje) resultado.push(pasaje);
      }
      return { pasajes: resultado, metodo: cosenos ? "hibrido" : "lexico" };
    },
  };
}
