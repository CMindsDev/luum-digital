/**
 * Configuración del servidor ligero, leída de variables de entorno (.env.local, sin prefijo VITE_).
 * Los valores inválidos no detienen el servidor: se usa el valor por defecto y se informa el NOMBRE
 * de la variable (nunca su valor).
 */
import { z } from "zod";
import { MODOS_GUARDAS, type ModoGuardas } from "../shared/asistente/servidor";

/**
 * Modelo Realtime por defecto. VERIFICAR disponibilidad y precio en la documentación oficial de
 * OpenAI antes de usarlo: el nombre proviene de los proyectos de referencia (Vital Oceans, Tricologs).
 */
export const MODELO_REALTIME_PREDETERMINADO = "gpt-realtime-2.1";
/** Voz por defecto (sólo se usa cuando la persona activa la voz). Verificar disponibilidad. */
export const VOZ_PREDETERMINADA = "marin";
/** Llamadas abiertas a la vez en este proceso (no configurable en el prototipo). */
export const MAX_LLAMADAS_SIMULTANEAS = 8;

/** Modelo por defecto de la respuesta citada de la búsqueda (rápido y barato). */
export const MODELO_BUSQUEDA_PREDETERMINADO = "gpt-4.1-mini";

export const MODELOS_CLEF = ["clef", "clef-flash"] as const;
export type ModeloClef = (typeof MODELOS_CLEF)[number];

export interface ConfiguracionServidor {
  puerto: number;
  openaiApiKey: string | null;
  modeloRealtime: string;
  /** Modelo que redacta la respuesta citada de la búsqueda (chat completions). */
  modeloBusqueda: string;
  voz: string;
  /** Duración máxima de una conversación Realtime (60–3600 s). */
  maxSegundos: number;
  /** Inicios de conversación por IP y hora (1–1000). */
  maxIniciosHora: number;
  maxLlamadasSimultaneas: number;
  cloudflareAccountId: string | null;
  cloudflareAiToken: string | null;
  clefModelo: ModeloClef;
  /** Tiempo máximo de una consulta a Clef (500–10000 ms). */
  clefTimeoutMs: number;
  guardas: ModoGuardas;
  /** Permite IA real (OpenAI) en el ámbito de bienestar, siempre con consentimiento explícito. */
  bienestarIaReal: boolean;
  origenesPermitidos: string[];
}

export interface ResultadoConfiguracion {
  config: ConfiguracionServidor;
  /** Nombres de variables con valores inválidos (se usó el valor por defecto). */
  variablesInvalidas: string[];
}

type Entorno = Readonly<Record<string, string | undefined>>;

const texto = z.string().trim();
const nombreModelo = /^[A-Za-z0-9._:-]{1,80}$/;
const nombreVoz = /^[a-z0-9_-]{1,40}$/;
const idCuenta = /^[A-Za-z0-9]{8,64}$/;

function limpio(valor: string | undefined): string | null {
  const resultado = texto.safeParse(valor);
  return resultado.success && resultado.data.length > 0 ? resultado.data : null;
}

function entero(
  entorno: Entorno,
  nombre: string,
  predeterminado: number,
  minimo: number,
  maximo: number,
  invalidas: string[],
): number {
  const valor = limpio(entorno[nombre]);
  if (valor === null) return predeterminado;
  const numero = Number(valor);
  if (!Number.isInteger(numero)) {
    invalidas.push(nombre);
    return predeterminado;
  }
  return Math.min(maximo, Math.max(minimo, numero));
}

function patron(entorno: Entorno, nombre: string, expresion: RegExp, predeterminado: string, invalidas: string[]): string {
  const valor = limpio(entorno[nombre]);
  if (valor === null) return predeterminado;
  if (!expresion.test(valor)) {
    invalidas.push(nombre);
    return predeterminado;
  }
  return valor;
}

function opcion<T extends string>(
  entorno: Entorno,
  nombre: string,
  opciones: readonly T[],
  predeterminado: T,
  invalidas: string[],
): T {
  const valor = limpio(entorno[nombre])?.toLowerCase() ?? null;
  if (valor === null) return predeterminado;
  const encontrada = opciones.find((candidata) => candidata === valor);
  if (!encontrada) {
    invalidas.push(nombre);
    return predeterminado;
  }
  return encontrada;
}

function booleano(entorno: Entorno, nombre: string, invalidas: string[]): boolean {
  const valor = limpio(entorno[nombre])?.toLowerCase() ?? null;
  if (valor === null) return false;
  if (["true", "1", "si", "sí"].includes(valor)) return true;
  if (["false", "0", "no"].includes(valor)) return false;
  invalidas.push(nombre);
  return false;
}

function secreto(entorno: Entorno, nombre: string, invalidas: string[]): string | null {
  const valor = limpio(entorno[nombre]);
  if (valor === null) return null;
  // Una clave con espacios o saltos de línea es casi siempre un error de copiado.
  if (/\s/.test(valor) || valor.length < 8 || valor.length > 400) {
    invalidas.push(nombre);
    return null;
  }
  return valor;
}

const ORIGENES_PREDETERMINADOS = ["http://localhost:5173", "http://localhost:4173"];

function origenes(entorno: Entorno, invalidas: string[]): string[] {
  const valor = limpio(entorno.ORIGENES_PERMITIDOS);
  if (valor === null) return [...ORIGENES_PREDETERMINADOS];
  const lista: string[] = [];
  for (const parte of valor.split(",")) {
    const candidato = parte.trim();
    if (!candidato) continue;
    try {
      const url = new URL(candidato);
      if ((url.protocol === "http:" || url.protocol === "https:") && url.origin === candidato.replace(/\/$/, "")) {
        lista.push(url.origin);
        continue;
      }
    } catch {
      // Se informa abajo.
    }
    invalidas.push("ORIGENES_PERMITIDOS");
    return [...ORIGENES_PREDETERMINADOS];
  }
  return lista.length > 0 ? [...new Set(lista)] : [...ORIGENES_PREDETERMINADOS];
}

export function leerConfiguracion(entorno: Entorno): ResultadoConfiguracion {
  const invalidas: string[] = [];
  const cuenta = limpio(entorno.CLOUDFLARE_ACCOUNT_ID);
  const cuentaValida = cuenta !== null && idCuenta.test(cuenta) ? cuenta : null;
  if (cuenta !== null && cuentaValida === null) invalidas.push("CLOUDFLARE_ACCOUNT_ID");
  const config: ConfiguracionServidor = {
    puerto: entero(entorno, "PORT", 8787, 1, 65_535, invalidas),
    openaiApiKey: secreto(entorno, "OPENAI_API_KEY", invalidas),
    modeloRealtime: patron(entorno, "ASISTENTE_REALTIME_MODEL", nombreModelo, MODELO_REALTIME_PREDETERMINADO, invalidas),
    modeloBusqueda: patron(entorno, "BUSQUEDA_MODELO", nombreModelo, MODELO_BUSQUEDA_PREDETERMINADO, invalidas),
    voz: patron(entorno, "ASISTENTE_VOZ", nombreVoz, VOZ_PREDETERMINADA, invalidas),
    maxSegundos: entero(entorno, "ASISTENTE_MAX_SEGUNDOS", 900, 60, 3600, invalidas),
    maxIniciosHora: entero(entorno, "ASISTENTE_MAX_INICIOS_HORA", 20, 1, 1000, invalidas),
    maxLlamadasSimultaneas: MAX_LLAMADAS_SIMULTANEAS,
    cloudflareAccountId: cuentaValida,
    cloudflareAiToken: secreto(entorno, "CLOUDFLARE_AI_TOKEN", invalidas),
    clefModelo: opcion(entorno, "CLEF_MODEL", MODELOS_CLEF, "clef", invalidas),
    clefTimeoutMs: entero(entorno, "CLEF_TIMEOUT_MS", 2500, 500, 10_000, invalidas),
    guardas: opcion(entorno, "ASISTENTE_GUARDAS", MODOS_GUARDAS, "shadow", invalidas),
    bienestarIaReal: booleano(entorno, "BIENESTAR_IA_REAL", invalidas),
    origenesPermitidos: origenes(entorno, invalidas),
  };
  return { config, variablesInvalidas: [...new Set(invalidas)] };
}
