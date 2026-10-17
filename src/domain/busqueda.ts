import { t } from "i18next";
import type { Categoria, ResultadoBusqueda, Servicio } from "@/types";
import { msg } from "@/i18n";

/**
 * Búsqueda en lenguaje natural sobre el catálogo (reglas locales, reproducibles).
 * Normaliza en español (minúsculas, sin acentos, sin palabras vacías, singular simple), expande
 * sinónimos coloquiales y puntúa por campo.
 */

export const PALABRAS_VACIAS: ReadonlySet<string> = new Set([
  "a", "al", "algo", "algun", "alguna", "alguno", "ante", "aqui", "como", "con", "cual", "cuales", "cuando", "de", "del",
  "donde", "e", "el", "ella", "ellos", "en", "entre", "era", "es", "esa", "ese", "eso", "esta", "este", "esto", "estoy",
  "fue", "ha", "hay", "la", "las", "le", "les", "lo", "los", "me", "mi", "mis", "muy", "necesito", "ni", "no", "nos",
  "o", "para", "pero", "por", "porque", "puedo", "que", "quiero", "quisiera", "se", "sea", "ser", "si", "sin", "sobre",
  "son", "su", "sus", "te", "tengo", "ti", "tu", "tus", "un", "una", "uno", "unos", "unas", "y", "ya", "yo", "saber",
  "busco", "buscar", "ayuda", "ayudame", "favor", "hacer", "puede", "pueden", "debo", "tiene",
]);

/**
 * Sinónimos coloquiales (clave normalizada en singular -> términos que también se buscan).
 * Fuente del vocabulario: términos de Mérida Móvil («Luminaria», «Bache a la vista») y del Portal Ciudadano.
 */
export const SINONIMOS: Readonly<Record<string, readonly string[]>> = {
  hoyo: ["bache", "bacheo"],
  hueco: ["bache", "bacheo"],
  bache: ["bacheo"],
  foco: ["luminaria", "alumbrado"],
  lampara: ["luminaria", "alumbrado"],
  poste: ["luminaria", "alumbrado"],
  luz: ["luminaria", "alumbrado"],
  alumbrado: ["luminaria"],
  luminaria: ["alumbrado"],
  coladera: ["rejilla", "desazolve"],
  encharcamiento: ["desazolve", "rejilla", "desague"],
  inundacion: ["desazolve", "rejilla", "desague"],
  basura: ["recoleccion", "residuo", "limpieza"],
  cacharro: ["basura", "recoleccion"],
  perro: ["animal", "mascota"],
  gato: ["animal", "mascota"],
  mascota: ["animal", "antirrabica"],
  psicologo: ["psicologico", "psicologia", "salud", "mental"],
  psicologa: ["psicologico", "psicologia", "salud", "mental"],
  terapia: ["psicologico", "psicologia"],
  ansiedad: ["psicologico", "psicologia", "salud", "mental"],
  depresion: ["psicologico", "psicologia", "salud", "mental"],
  chamba: ["empleo", "trabajo", "vacante", "bolsa"],
  jale: ["empleo", "trabajo"],
  trabajo: ["empleo", "bolsa", "laboral"],
  empleo: ["trabajo", "bolsa"],
  negocio: ["empresa", "apertura", "funcionamiento", "comercial"],
  changarro: ["negocio", "empresa", "funcionamiento"],
  local: ["establecimiento", "comercial", "funcionamiento"],
  tienda: ["establecimiento", "comercial"],
  predial: ["impuesto", "catastral"],
  pagar: ["pago", "impuesto"],
  pago: ["pagar", "impuesto"],
  cultura: ["cultural", "museo", "taller", "arte"],
  cultural: ["cultura", "museo", "taller"],
  evento: ["cultural", "festival"],
  museo: ["cultura", "cultural"],
  deporte: ["deportivo", "deportiva", "entrenamiento"],
  futbol: ["deporte", "deportivo", "entrenamiento"],
  natacion: ["deporte", "acuatico"],
  beca: ["apoyo", "educacion"],
  escuela: ["educacion", "escolar", "beca"],
  arbol: ["poda", "arbolado"],
  credencial: ["identificacion", "constancia"],
  doctor: ["medico", "salud", "consulta"],
  medico: ["salud", "consulta"],
  mujer: ["mujeres", "violencia"],
  violencia: ["mujer", "mujeres", "atencion"],
  queja: ["demanda", "reporte", "atencion"],
  tramite: ["servicio"],
};

export function quitarAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function normalizarTexto(texto: string): string {
  return quitarAcentos(texto.toLowerCase())
    .replace(/[^a-z0-9ñ\s-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Singular simple en español (suficiente para la búsqueda; no es un lematizador). */
export function singularSimple(palabra: string): string {
  if (palabra.length <= 3 || !palabra.endsWith("s")) return palabra;
  if (palabra.endsWith("ces")) return `${palabra.slice(0, -3)}z`;
  if (palabra.endsWith("es")) {
    const previa = palabra.at(-3) ?? "";
    if ("lrndj".includes(previa) && palabra.length > 4) return palabra.slice(0, -2);
  }
  return palabra.slice(0, -1);
}

export function tokenizar(texto: string): string[] {
  return normalizarTexto(texto)
    .split(" ")
    .filter((t) => t.length > 1 && !PALABRAS_VACIAS.has(t))
    .map(singularSimple);
}

/** Tokens de la consulta más sus sinónimos (sin duplicados). */
export function expandirConSinonimos(tokens: readonly string[]): string[] {
  const conjunto = new Set<string>();
  for (const token of tokens) {
    conjunto.add(token);
    for (const sinonimo of SINONIMOS[token] ?? []) conjunto.add(singularSimple(sinonimo));
  }
  return [...conjunto];
}

function prefijoComun(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) i += 1;
  return i;
}

/** Coincidencia tolerante: igual, o raíz común larga («psicologico» ~ «psicologia», «bache» ~ «bacheo»). */
export function coincidenTerminos(a: string, b: string): boolean {
  if (a === b) return true;
  const corta = Math.min(a.length, b.length);
  if (corta < 4) return false;
  const comun = prefijoComun(a, b);
  return comun >= 4 && comun >= Math.ceil(corta * 0.75);
}

const PESOS = {
  nombre: 10,
  nombreCiudadano: 8,
  palabrasClave: 7,
  categoria: 4,
  dependencia: 3,
  descripcion: 2,
} as const;

type CampoBusqueda = keyof typeof PESOS;

const ETIQUETA_CAMPO: Record<CampoBusqueda, string> = {
  nombre: msg("nombre"),
  nombreCiudadano: msg("nombre ciudadano"),
  palabrasClave: msg("palabras clave"),
  categoria: msg("categoría"),
  dependencia: msg("dependencia"),
  descripcion: msg("descripción"),
};

export interface IndiceServicio {
  servicio: Servicio;
  campos: Record<CampoBusqueda, string[]>;
}

export function indexarServicio(servicio: Servicio, categorias: readonly Categoria[]): IndiceServicio {
  const nombresCategoria = [servicio.categoria, ...(servicio.categoriasSecundarias ?? [])]
    .map((id) => categorias.find((c) => c.id === id)?.nombre ?? id)
    .join(" ");
  return {
    servicio,
    campos: {
      nombre: tokenizar(servicio.nombre),
      nombreCiudadano: tokenizar(servicio.nombreCiudadano ?? ""),
      palabrasClave: tokenizar((servicio.palabrasClave ?? []).join(" ")),
      categoria: tokenizar(nombresCategoria),
      dependencia: tokenizar(servicio.dependencia ?? ""),
      descripcion: tokenizar(servicio.descripcion),
    },
  };
}

export function puntuar(indice: IndiceServicio, terminos: readonly string[], terminosOriginales: readonly string[]): ResultadoBusqueda {
  let puntuacion = 0;
  const coincidencias: string[] = [];
  for (const campo of Object.keys(PESOS) as CampoBusqueda[]) {
    const tokens = indice.campos[campo];
    let aciertos = 0;
    for (const termino of terminos) {
      if (tokens.some((t) => coincidenTerminos(t, termino))) {
        // Los términos escritos por la persona pesan más que los sinónimos.
        aciertos += terminosOriginales.includes(termino) ? 1 : 0.6;
      }
    }
    if (aciertos > 0) {
      puntuacion += PESOS[campo] * aciertos;
      coincidencias.push(t(ETIQUETA_CAMPO[campo]));
    }
  }
  // Prioriza la información verificada a igual coincidencia.
  if (puntuacion > 0 && indice.servicio.estadoDeInformacion === "verificada") puntuacion += 1;
  return { servicio: indice.servicio, puntuacion: Math.round(puntuacion * 10) / 10, coincidencias };
}

export function buscarEnIndice(consulta: string, indice: readonly IndiceServicio[], limite = 20): ResultadoBusqueda[] {
  const originales = tokenizar(consulta);
  if (originales.length === 0) return [];
  const terminos = expandirConSinonimos(originales);
  return indice
    .map((entrada) => puntuar(entrada, terminos, originales))
    .filter((r) => r.puntuacion > 0)
    .sort((a, b) => b.puntuacion - a.puntuacion || a.servicio.nombre.localeCompare(b.servicio.nombre, "es"))
    .slice(0, limite);
}

/** Atajo sin índice precalculado (pruebas y listas pequeñas). */
export function buscarServicios(
  consulta: string,
  servicios: readonly Servicio[],
  categorias: readonly Categoria[],
  limite = 20,
): ResultadoBusqueda[] {
  return buscarEnIndice(
    consulta,
    servicios.map((s) => indexarServicio(s, categorias)),
    limite,
  );
}
