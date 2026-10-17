/**
 * Cliente del conocimiento verificado del asistente (/api/asistente/conocimiento). Tolerante a
 * fallos: sin servidor o con error devuelve null y el ejecutor responde que no pudo consultar
 * (nunca inventa). No guarda ni registra la consulta.
 */
import {
  RespuestaConocimientoSchema,
  type RespuestaConocimiento,
} from "@shared/asistente/conocimiento";
import { RUTAS_API_ASISTENTE } from "@shared/asistente/servidor";

const TIEMPO_MAXIMO_MS = 8000;

export interface ClienteConocimiento {
  buscar(consulta: string): Promise<RespuestaConocimiento | null>;
}

export function crearClienteConocimiento(opciones: { fetch?: typeof fetch } = {}): ClienteConocimiento {
  const solicitar = opciones.fetch ?? ((entrada, init) => globalThis.fetch(entrada, init));
  return {
    async buscar(consulta) {
      try {
        const respuesta = await solicitar(RUTAS_API_ASISTENTE.conocimiento, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consulta: consulta.trim().slice(0, 200) }),
          credentials: "same-origin",
          cache: "no-store",
          signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
        });
        if (!respuesta.ok) return null;
        const resultado = RespuestaConocimientoSchema.safeParse(await respuesta.json());
        return resultado.success ? resultado.data : null;
      } catch {
        return null;
      }
    },
  };
}
