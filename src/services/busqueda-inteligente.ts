import {
  RespuestaBusquedaSchema,
  SolicitudBusquedaSchema,
  type RespuestaBusqueda,
} from "@shared/asistente/busqueda";
import { RUTAS_API_ASISTENTE } from "@shared/asistente/servidor";

const TIEMPO_MAXIMO_MS = 12_000;

export interface ClienteBusquedaInteligente {
  buscar(consulta: string): Promise<RespuestaBusqueda | null>;
}

export function crearClienteBusquedaInteligente(opciones: { fetch?: typeof fetch } = {}): ClienteBusquedaInteligente {
  const solicitar = opciones.fetch ?? ((entrada, init) => globalThis.fetch(entrada, init));
  return {
    async buscar(consulta) {
      const validacion = SolicitudBusquedaSchema.safeParse({ consulta });
      if (!validacion.success) return null;
      try {
        const respuesta = await solicitar(RUTAS_API_ASISTENTE.busqueda, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validacion.data),
          credentials: "same-origin",
          cache: "no-store",
          signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
        });
        if (!respuesta.ok) return null;
        const resultado = RespuestaBusquedaSchema.safeParse(await respuesta.json());
        return resultado.success ? resultado.data : null;
      } catch {
        return null;
      }
    },
  };
}
