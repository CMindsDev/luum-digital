/** Normalización de texto en español para la búsqueda por palabras (sin acentos, sin plurales simples). */

const PALABRAS_VACIAS = new Set([
  "a", "al", "algo", "como", "con", "cual", "cuales", "cuando", "cuanto", "cuantos", "cuantas", "de", "del", "el", "ella", "en", "entre", "era",
  "es", "esa", "ese", "eso", "esta", "este", "esto", "hay", "la", "las", "le", "lo", "los", "me", "mi", "muy", "no", "nos", "o", "para", "pero", "por",
  "que", "quien", "se", "si", "sin", "son", "su", "sus", "te", "tiene", "tienen", "un", "una", "uno", "unos", "unas", "y", "ya", "yo", "puedo",
  "quiero", "necesito", "donde", "hacer", "sobre", "dime", "dame", "favor", "por", "merida", "yucatan",
]);

export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function raiz(palabra: string): string {
  if (palabra.length > 6 && palabra.endsWith("es")) return palabra.slice(0, -2);
  if (palabra.length > 4 && palabra.endsWith("s")) return palabra.slice(0, -1);
  return palabra;
}

/** Palabras con significado, normalizadas y sin plural simple. */
export function palabras(texto: string): string[] {
  return normalizar(texto)
    .split(" ")
    .filter((palabra) => palabra.length > 1 && !PALABRAS_VACIAS.has(palabra))
    .map(raiz);
}
