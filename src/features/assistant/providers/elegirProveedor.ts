/**
 * Elige los proveedores del asistente según GET /api/asistente/estado.
 *
 * - Siempre está el de demostración (respuestas programadas), y es el predeterminado.
 * - Si el servidor informa realtime.disponible, se OFRECE el proveedor real; la interfaz deja que
 *   la persona lo elija explícitamente. En bienestar, además, el servidor debe permitir IA real
 *   (bienestarIaReal) y la persona debe dar su consentimiento al iniciar.
 * - Nunca presenta el de demostración como IA real.
 */
import type { AmbitoAsistente } from "@shared/asistente/acciones";
import { EstadoServidorSchema, RUTAS_API_ASISTENTE } from "@shared/asistente/servidor";
import { msg } from "@/i18n";
import type { AssistantProvider, EstadoServidorAsistente } from "@/services/contracts";
import { DemoAssistantProvider, type OpcionesProveedorDemo } from "./demo/DemoAssistantProvider";
import { RealtimeAssistantProvider, type DependenciasRealtime } from "./realtime/RealtimeAssistantProvider";

const TIEMPO_ESTADO_MS = 4000;

export const MOTIVO_SIN_SERVIDOR = msg("La voz no está disponible ahora. Puedes escribirme.");

/** Estado del servidor sin secretos, o null si no responde (sin servidor = sólo demostración). */
export async function consultarEstadoServidor(opciones: { fetch?: typeof fetch; signal?: AbortSignal } = {}): Promise<EstadoServidorAsistente | null> {
  const solicitar = opciones.fetch ?? ((entrada, init) => globalThis.fetch(entrada, init));
  try {
    const respuesta = await solicitar(RUTAS_API_ASISTENTE.estado, {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      signal: opciones.signal ?? AbortSignal.timeout(TIEMPO_ESTADO_MS),
    });
    if (!respuesta.ok) return null;
    const resultado = EstadoServidorSchema.safeParse(await respuesta.json());
    if (!resultado.success) return null;
    const { realtime, clef, bienestarIaReal } = resultado.data;
    return {
      realtime: {
        disponible: realtime.disponible,
        ...(realtime.modelo ? { modelo: realtime.modelo } : {}),
        ...(realtime.motivo ? { motivo: realtime.motivo } : {}),
      },
      clef,
      bienestarIaReal,
    };
  } catch {
    return null;
  }
}

export interface ProveedoresAsistente {
  /** Respuestas programadas: siempre disponible y predeterminado. */
  demo: DemoAssistantProvider;
  /** IA real, sólo si el servidor la ofrece para este ámbito. La persona debe elegirla. */
  realtime: RealtimeAssistantProvider | null;
  /** Por qué no hay IA real (texto legible), si no la hay. */
  motivoSinRealtime: string | null;
  estado: EstadoServidorAsistente | null;
  /** Lista para un selector: primero el de demostración. */
  disponibles: AssistantProvider[];
}

export interface OpcionesElegirProveedor {
  ambito: AmbitoAsistente;
  fetch?: typeof fetch;
  signal?: AbortSignal;
  demo?: OpcionesProveedorDemo;
  realtime?: DependenciasRealtime;
}

export async function elegirProveedores(opciones: OpcionesElegirProveedor): Promise<ProveedoresAsistente> {
  const demo = new DemoAssistantProvider(opciones.demo);
  const estado = await consultarEstadoServidor({
    ...(opciones.fetch ? { fetch: opciones.fetch } : {}),
    ...(opciones.signal ? { signal: opciones.signal } : {}),
  });
  let realtime: RealtimeAssistantProvider | null = null;
  let motivoSinRealtime: string | null = null;
  if (!estado) {
    motivoSinRealtime = MOTIVO_SIN_SERVIDOR;
  } else if (!estado.realtime.disponible) {
    motivoSinRealtime = msg("La voz no está disponible ahora. Puedes escribirme.");
  } else if (opciones.ambito === "bienestar" && !estado.bienestarIaReal) {
    motivoSinRealtime = msg("La voz no está disponible ahora. Puedes escribirme.");
  } else {
    realtime = new RealtimeAssistantProvider({
      ...(opciones.fetch ? { fetch: opciones.fetch } : {}),
      ...opciones.realtime,
      ...(estado.realtime.modelo ? { modelo: estado.realtime.modelo } : {}),
    });
  }
  return { demo, realtime, motivoSinRealtime, estado, disponibles: realtime ? [demo, realtime] : [demo] };
}
