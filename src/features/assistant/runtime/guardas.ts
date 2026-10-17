/**
 * Cliente de las guardas Clef del servidor (/api/asistente/guardas/*), tolerante a fallos:
 * sin servidor, sin credenciales o con error, devuelve "sin señal" y la app sigue igual.
 * Sólo se consulta para acciones de nivel B. Clef nunca autoriza nada: la confirmación en
 * pantalla sigue siendo obligatoria.
 */
import { ACCIONES, esNombreAccion } from "@shared/asistente/acciones";
import {
  LIMITES_GUARDAS,
  RespuestaGuardaAccionSchema,
  RespuestaGuardaIntencionSchema,
  RUTAS_API_ASISTENTE,
  type MensajeReciente,
  type RespuestaGuardaAccion,
  type RespuestaGuardaIntencion,
} from "@shared/asistente/servidor";

const TIEMPO_MAXIMO_MS = 4000;

export interface ClienteGuardas {
  evaluarAccion(entrada: { accion: string; argumentos: unknown; mensajesRecientes: readonly MensajeReciente[] }): Promise<RespuestaGuardaAccion>;
  clasificarIntencion(texto: string): Promise<RespuestaGuardaIntencion | null>;
}

const SIN_SENAL: RespuestaGuardaAccion = { probabilidad: null, decision: "sin_senal", modo: "off", aplica: true };

export function aplicaGuarda(accion: string): boolean {
  return esNombreAccion(accion) && ACCIONES[accion].nivel === "B";
}

async function postJson(solicitar: typeof fetch, ruta: string, cuerpo: unknown): Promise<unknown> {
  const respuesta = await solicitar(ruta, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
    credentials: "same-origin",
    cache: "no-store",
    signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
  });
  if (!respuesta.ok) throw new Error(`guarda_${respuesta.status}`);
  return respuesta.json();
}

export function crearClienteGuardas(opciones: { fetch?: typeof fetch } = {}): ClienteGuardas {
  const solicitar = opciones.fetch ?? ((entrada, init) => globalThis.fetch(entrada, init));
  return {
    async evaluarAccion({ accion, argumentos, mensajesRecientes }) {
      if (!aplicaGuarda(accion)) return { ...SIN_SENAL, aplica: false };
      const mensajes = mensajesRecientes
        .slice(-LIMITES_GUARDAS.mensajes)
        .map((mensaje) => ({ rol: mensaje.rol, texto: mensaje.texto.slice(0, LIMITES_GUARDAS.caracteresPorMensaje) }));
      try {
        const datos = await postJson(solicitar, RUTAS_API_ASISTENTE.guardaAccion, { accion, argumentos, mensajesRecientes: mensajes });
        const resultado = RespuestaGuardaAccionSchema.safeParse(datos);
        return resultado.success ? resultado.data : SIN_SENAL;
      } catch {
        return SIN_SENAL;
      }
    },
    async clasificarIntencion(texto) {
      const limpio = texto.trim().slice(0, LIMITES_GUARDAS.caracteresIntencion);
      if (!limpio) return null;
      try {
        const datos = await postJson(solicitar, RUTAS_API_ASISTENTE.guardaIntencion, { texto: limpio });
        const resultado = RespuestaGuardaIntencionSchema.safeParse(datos);
        return resultado.success ? resultado.data : null;
      } catch {
        return null;
      }
    },
  };
}
