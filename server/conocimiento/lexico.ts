/** Búsqueda por palabras (BM25 simplificado) sobre los pasajes. Sirve sola y como señal del modo híbrido. */
import type { Pasaje } from "../../shared/asistente/conocimiento";
import { palabras } from "./texto";

const K1 = 1.4;
const B = 0.7;
const PESO_TITULO = 3;

export interface IndiceLexico {
  puntuar(consulta: string): Map<string, number>;
}

export function crearIndiceLexico(pasajes: readonly Pasaje[]): IndiceLexico {
  const documentos = pasajes.map((pasaje) => {
    const frecuencias = new Map<string, number>();
    const sumar = (palabra: string, peso: number) => frecuencias.set(palabra, (frecuencias.get(palabra) ?? 0) + peso);
    for (const palabra of palabras(pasaje.titulo)) sumar(palabra, PESO_TITULO);
    for (const palabra of palabras(pasaje.texto)) sumar(palabra, 1);
    let longitud = 0;
    for (const veces of frecuencias.values()) longitud += veces;
    return { id: pasaje.id, frecuencias, longitud };
  });
  const promedio = documentos.reduce((suma, doc) => suma + doc.longitud, 0) / Math.max(1, documentos.length);
  const documentosPorPalabra = new Map<string, number>();
  for (const doc of documentos) for (const palabra of doc.frecuencias.keys()) documentosPorPalabra.set(palabra, (documentosPorPalabra.get(palabra) ?? 0) + 1);

  return {
    puntuar(consulta) {
      const resultado = new Map<string, number>();
      const terminos = [...new Set(palabras(consulta))];
      if (terminos.length === 0) return resultado;
      for (const doc of documentos) {
        let puntos = 0;
        for (const termino of terminos) {
          const veces = doc.frecuencias.get(termino);
          if (!veces) continue;
          const df = documentosPorPalabra.get(termino) ?? 1;
          const idf = Math.log(1 + (documentos.length - df + 0.5) / (df + 0.5));
          puntos += (idf * veces * (K1 + 1)) / (veces + K1 * (1 - B + (B * doc.longitud) / promedio));
        }
        if (puntos > 0) resultado.set(doc.id, puntos);
      }
      return resultado;
    },
  };
}
