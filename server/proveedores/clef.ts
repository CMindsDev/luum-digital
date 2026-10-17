/**
 * Decisiones tipadas y calibradas con los modelos Clef de Cloudflare Workers AI.
 * Portado de Vital Oceans (backend/decisions.py) y Tricologs (src/lib/asistente/clef.ts).
 *
 * Siempre hay alternativa: sin credenciales, con error, fuera de tiempo o en pausa, `decidir`
 * devuelve null y quien llama sigue su ruta determinista. Clef aporta una señal; nunca autoriza.
 * Nunca se registra el estado (puede contener lo que escribió la persona).
 */
import { createHash } from "node:crypto";
import { z } from "zod";
import { registradorSilencioso, type Registrador } from "../registro";

const API = "https://api.cloudflare.com/client/v4/accounts/{cuenta}/ai/run/@cf/cloudflare/{modelo}";
/** Tras un fallo, el proveedor se omite este tiempo para no frenar al asistente. */
export const PAUSA_TRAS_FALLO_MS = 60_000;
const TAMANO_CACHE = 512;

export type PreguntaClef =
  | { type: "noul"; instructions: string; criteria?: { true: string; false: string } }
  | { type: "choice"; instructions: string; criteria: Record<string, string> };

const RespuestaNoulSchema = z.object({ type: z.literal("noul"), noul: z.number().min(0).max(1) });
const RespuestaChoiceSchema = z.object({
  type: z.literal("choice"),
  choice: z.string(),
  probabilities: z.record(z.string(), z.number().min(0).max(1)),
  confidence: z.number().optional(),
});
const RespuestaClefSchema = z.discriminatedUnion("type", [RespuestaNoulSchema, RespuestaChoiceSchema]);
export type RespuestaClef = z.infer<typeof RespuestaClefSchema>;

const CuerpoSchema = z.object({
  result: z.object({ answers: z.record(z.string(), RespuestaClefSchema) }),
});

export interface ClienteClef {
  readonly configurado: boolean;
  /** Respuestas con las mismas claves que `preguntas`, o null si no hubo decisión. */
  decidir(estado: string, preguntas: Readonly<Record<string, PreguntaClef>>): Promise<Record<string, RespuestaClef> | null>;
}

export interface OpcionesClef {
  cuentaId: string | null;
  token: string | null;
  modelo: string;
  timeoutMs: number;
  fetch?: typeof fetch;
  registrar?: Registrador;
  ahora?: () => number;
}

class FalloClef extends Error {
  readonly tipo: string;
  constructor(tipo: string) {
    super(tipo);
    this.name = "FalloClef";
    this.tipo = tipo;
  }
}

function tipoDeFallo(error: unknown): string {
  if (error instanceof FalloClef) return error.tipo;
  if (error instanceof z.ZodError || error instanceof SyntaxError) return "respuesta_invalida";
  if (error instanceof Error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") return "tiempo_agotado";
    return "red";
  }
  return "desconocido";
}

export function crearClienteClef(opciones: OpcionesClef): ClienteClef {
  const { cuentaId, token, modelo, timeoutMs } = opciones;
  const solicitar = opciones.fetch ?? fetch;
  const registrar = opciones.registrar ?? registradorSilencioso;
  const ahora = opciones.ahora ?? Date.now;
  const configurado = Boolean(cuentaId && token);
  const cache = new Map<string, Record<string, RespuestaClef>>();
  let pausadoHasta = 0;

  async function decidir(estado: string, preguntas: Readonly<Record<string, PreguntaClef>>) {
    if (!cuentaId || !token || ahora() < pausadoHasta) return null;
    const clave = createHash("sha256").update(JSON.stringify([modelo, estado, preguntas])).digest("hex");
    const enCache = cache.get(clave);
    if (enCache) {
      cache.delete(clave);
      cache.set(clave, enCache);
      return enCache;
    }
    try {
      const url = API.replace("{cuenta}", encodeURIComponent(cuentaId)).replace("{modelo}", encodeURIComponent(modelo));
      const respuesta = await solicitar(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelo, state: estado, questions: preguntas }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!respuesta.ok) throw new FalloClef(`http_${respuesta.status}`);
      const cuerpo = CuerpoSchema.parse(await respuesta.json());
      const respuestas: Record<string, RespuestaClef> = {};
      for (const id of Object.keys(preguntas)) {
        const respuestaPregunta = cuerpo.result.answers[id];
        if (!respuestaPregunta || respuestaPregunta.type !== preguntas[id]?.type) throw new FalloClef("respuesta_incompleta");
        respuestas[id] = respuestaPregunta;
      }
      cache.set(clave, respuestas);
      while (cache.size > TAMANO_CACHE) {
        const primera = cache.keys().next();
        if (primera.done) break;
        cache.delete(primera.value);
      }
      return respuestas;
    } catch (error) {
      // Nunca se registra el estado ni la pregunta: sólo el tipo de fallo.
      registrar("clef_no_disponible", { tipo: tipoDeFallo(error), modelo });
      pausadoHasta = ahora() + PAUSA_TRAS_FALLO_MS;
      return null;
    }
  }

  return { configurado, decidir };
}
