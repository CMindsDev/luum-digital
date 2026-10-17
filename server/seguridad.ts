/**
 * Middlewares y utilidades de seguridad del servidor ligero.
 * - Escrituras sólo desde orígenes permitidos (protección CSRF; el navegador habla con /api vía proxy).
 * - Respuestas del asistente sin caché.
 * - Límites por IP en ventanas de tiempo.
 */
import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context, MiddlewareHandler } from "hono";
import { CODIGOS_ERROR, type ErrorServidor } from "../shared/asistente/servidor";

const METODOS_SEGUROS = new Set(["GET", "HEAD", "OPTIONS"]);

export function respuestaError(c: Context, estado: 400 | 403 | 404 | 409 | 413 | 415 | 422 | 429 | 500 | 502 | 503, cuerpo: ErrorServidor) {
  if (cuerpo.reintentarEnSegundos !== undefined) c.header("Retry-After", String(Math.max(1, Math.ceil(cuerpo.reintentarEnSegundos))));
  return c.json(cuerpo, estado);
}

/** Rechaza escrituras (POST, PUT, PATCH, DELETE) sin un Origin de la lista permitida. */
export function verificarOrigen(origenesPermitidos: readonly string[]): MiddlewareHandler {
  const permitidos = new Set(origenesPermitidos);
  return async (c, next) => {
    if (!METODOS_SEGUROS.has(c.req.method)) {
      const origen = c.req.header("Origin");
      if (!origen || !permitidos.has(origen)) {
        return respuestaError(c, 403, {
          error: "Origen no permitido para esta solicitud.",
          codigo: CODIGOS_ERROR.origenNoPermitido,
        });
      }
    }
    await next();
  };
}

/** Cabeceras para las respuestas de la API (nada de caché ni de rastreo). */
export function cabecerasApi(): MiddlewareHandler {
  return async (c, next) => {
    await next();
    c.header("X-Content-Type-Options", "nosniff");
    c.header("Referrer-Policy", "no-referrer");
    c.header("Cross-Origin-Resource-Policy", "same-origin");
  };
}

export function sinCache(): MiddlewareHandler {
  return async (c, next) => {
    await next();
    c.header("Cache-Control", "no-store, max-age=0");
    c.header("Pragma", "no-cache");
    c.header("Expires", "0");
  };
}

/**
 * IP remota de la conexión. No se confía en X-Forwarded-For: el servidor escucha sólo en 127.0.0.1
 * y, detrás del proxy de Vite, todas las solicitudes comparten la IP local (el límite es por equipo).
 */
export function ipDe(c: Context): string {
  try {
    return getConnInfo(c).remote.address ?? "desconocida";
  } catch {
    return "desconocida";
  }
}

/** Lee un cuerpo JSON; exige Content-Type application/json (defensa adicional contra CSRF). */
export async function leerJson(c: Context): Promise<{ ok: true; valor: unknown } | { ok: false; respuesta: Response }> {
  const tipo = c.req.header("Content-Type") ?? "";
  if (!/^application\/json\b/i.test(tipo)) {
    return {
      ok: false,
      respuesta: respuestaError(c, 415, { error: "El cuerpo debe enviarse como JSON.", codigo: CODIGOS_ERROR.tipoContenido }),
    };
  }
  try {
    return { ok: true, valor: await c.req.json() };
  } catch {
    return {
      ok: false,
      respuesta: respuestaError(c, 400, { error: "La solicitud no es un JSON válido.", codigo: CODIGOS_ERROR.solicitudInvalida }),
    };
  }
}

export type ResultadoLimite = { permitido: true; devolver: () => void } | { permitido: false; reintentarEnSegundos: number };

/** Límite de eventos por clave en una ventana deslizante (memoria acotada). */
export class LimitadorVentana {
  private readonly registros = new Map<string, number[]>();
  private readonly limite: number;
  private readonly ventanaMs: number;
  private readonly ahora: () => number;
  private readonly maxClaves: number;

  constructor(opciones: { limite: number; ventanaMs: number; ahora?: () => number; maxClaves?: number }) {
    this.limite = opciones.limite;
    this.ventanaMs = opciones.ventanaMs;
    this.ahora = opciones.ahora ?? Date.now;
    this.maxClaves = opciones.maxClaves ?? 5000;
  }

  intentar(clave: string): ResultadoLimite {
    const ahora = this.ahora();
    const vigentes = (this.registros.get(clave) ?? []).filter((momento) => ahora - momento < this.ventanaMs);
    if (vigentes.length >= this.limite) {
      this.registros.set(clave, vigentes);
      // Se libera un lugar cuando el registro más antiguo sale de la ventana.
      const masAntiguo = vigentes[vigentes.length - this.limite] ?? ahora;
      return { permitido: false, reintentarEnSegundos: Math.max(1, Math.ceil((this.ventanaMs - (ahora - masAntiguo)) / 1000)) };
    }
    vigentes.push(ahora);
    this.registros.delete(clave);
    this.registros.set(clave, vigentes);
    this.podar();
    return {
      permitido: true,
      devolver: () => {
        const lista = this.registros.get(clave);
        const indice = lista?.lastIndexOf(ahora) ?? -1;
        if (lista && indice >= 0) lista.splice(indice, 1);
      },
    };
  }

  private podar() {
    while (this.registros.size > this.maxClaves) {
      const primera = this.registros.keys().next();
      if (primera.done) return;
      this.registros.delete(primera.value);
    }
  }
}
