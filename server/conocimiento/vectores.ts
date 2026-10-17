/** Vectores del índice: Float32 en base64 (compacto) y similitud coseno. */

export const MODELO_EMBEDDING = "text-embedding-3-small";
export const DIMENSIONES_EMBEDDING = 512;

export interface ArchivoVectores {
  modelo: string;
  dimensiones: number;
  ids: string[];
  /** Float32 little-endian, ids.length × dimensiones, en base64. Cada vector va normalizado (norma 1). */
  datos: string;
}

export function normalizarVector(vector: ArrayLike<number>): Float32Array {
  const salida = new Float32Array(vector.length);
  let suma = 0;
  for (let i = 0; i < vector.length; i += 1) suma += (vector[i] ?? 0) ** 2;
  const norma = Math.sqrt(suma) || 1;
  for (let i = 0; i < vector.length; i += 1) salida[i] = (vector[i] ?? 0) / norma;
  return salida;
}

export function codificarVectores(vectores: readonly Float32Array[]): string {
  const dimensiones = vectores[0]?.length ?? 0;
  const plano = new Float32Array(vectores.length * dimensiones);
  vectores.forEach((vector, indice) => plano.set(vector, indice * dimensiones));
  return Buffer.from(plano.buffer, plano.byteOffset, plano.byteLength).toString("base64");
}

export function decodificarVectores(archivo: ArchivoVectores): Float32Array[] {
  const bytes = Buffer.from(archivo.datos, "base64");
  const plano = new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  if (plano.length !== archivo.ids.length * archivo.dimensiones) throw new Error("El archivo de vectores no coincide con sus ids.");
  return archivo.ids.map((_, indice) => plano.subarray(indice * archivo.dimensiones, (indice + 1) * archivo.dimensiones));
}

/** Producto punto: con vectores normalizados equivale al coseno. */
export function coseno(a: Float32Array, b: Float32Array): number {
  let suma = 0;
  for (let i = 0; i < a.length; i += 1) suma += (a[i] ?? 0) * (b[i] ?? 0);
  return suma;
}
