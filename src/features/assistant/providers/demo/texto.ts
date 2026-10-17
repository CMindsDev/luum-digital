/**
 * Utilidades de texto de los escenarios programados (reglas locales, reproducibles).
 */
import type { MotivoApoyo } from "../../runtime/ejecutor";

/** Minúsculas, sin acentos ni signos, espacios simples. «¿Año?» → «ano». */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[¿?¡!.,;:()"'«»“”]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function contiene(normalizado: string, frases: readonly string[]): boolean {
  return frases.some((frase) => normalizado.includes(frase));
}

/**
 * Lista local de señales de riesgo. No depende de un clasificador: ante cualquier coincidencia se
 * muestra ayuda humana de inmediato. Prefiere el falso positivo (mostrar ayuda de más).
 */
const RIESGO: Readonly<Record<MotivoApoyo, readonly string[]>> = {
  salud_mental: [
    "suicid",
    "quitarme la vida",
    "quitar la vida",
    "matarme",
    "me quiero matar",
    "no quiero vivir",
    "no quiero seguir viviendo",
    "ya no quiero estar aqui",
    "acabar con mi vida",
    "acabar con todo",
    "hacerme dano",
    "lastimarme",
    "autolesion",
    "cortarme",
    "me corto",
    "quiero morir",
    "me quiero morir",
    "desaparecer para siempre",
    "mejor muerto",
    "mejor muerta",
    "no vale la pena vivir",
    "ya no puedo mas",
  ],
  violencia: [
    "me golpea",
    "me golpeo",
    "me pega",
    "me pego",
    "me amenaza",
    "me amenazo",
    "me quiere matar",
    "me va a matar",
    "me violo",
    "violacion",
    "abuso sexual",
    "abusaron de mi",
    "abusa de mi",
    "violencia",
    "me maltrata",
    "me esta siguiendo",
    "me acosa",
  ],
  emergencia: [
    "emergencia",
    "en peligro",
    "auxilio",
    "ayuda urgente",
    "ayuda inmediata",
    "me estoy muriendo",
    "se esta muriendo",
    "no respira",
    "sobredosis",
    "me desmaye",
    "infarto",
    "incendio",
    "accidente grave",
    "esta sangrando",
  ],
  orientacion: [],
};

const ORDEN: readonly MotivoApoyo[] = ["salud_mental", "violencia", "emergencia"];

/** Motivo de ayuda humana si el texto tiene señales de riesgo; null si no. */
export function detectarRiesgo(texto: string): MotivoApoyo | null {
  const normalizado = normalizar(texto);
  return ORDEN.find((motivo) => contiene(normalizado, RIESGO[motivo])) ?? null;
}

const AFIRMACIONES = /^(si|sip|claro|va|vale|ok|okay|sale|dale|andale|por favor|porfa|esta bien|de acuerdo|adelante|me parece|si por favor|si gracias|muestramelos|muestrame)\b/;
const NEGACIONES = /^(no|nop|mejor no|no gracias|otro|otra|ninguno|ninguna|despues|luego)\b/;

export function esAfirmacion(normalizado: string): boolean {
  return AFIRMACIONES.test(normalizado);
}

export function esNegacion(normalizado: string): boolean {
  return NEGACIONES.test(normalizado);
}

export function capitalizar(texto: string): string {
  const limpio = texto.trim();
  return limpio ? `${limpio.charAt(0).toUpperCase()}${limpio.slice(1)}` : limpio;
}
