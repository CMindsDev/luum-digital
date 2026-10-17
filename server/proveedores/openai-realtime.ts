/**
 * Cliente mínimo de OpenAI Realtime por WebRTC con la interfaz unificada (proxy SDP).
 * Portado de Vital Oceans (backend/alex.py, AlexRuntime.start/hangup) y Tricologs
 * (src/app/api/asistente/voz/route.ts).
 *
 * - POST https://api.openai.com/v1/realtime/calls (multipart: sdp + session) con la clave del servidor.
 * - El id de la llamada llega en la cabecera Location; el navegador nunca lo recibe.
 * - POST https://api.openai.com/v1/realtime/calls/{call_id}/hangup para colgar.
 * Nunca registra la clave, el SDP ni el contenido de la sesión; sólo estados y códigos de error.
 */
import { registradorSilencioso, type Registrador } from "../registro";

const OPENAI = "https://api.openai.com/v1";
const TIEMPO_CREAR_MS = 25_000;
const TIEMPO_COLGAR_MS = 15_000;

export type ResultadoLlamada =
  | { ok: true; callId: string; sdp: string }
  | { ok: false; tipo: "sin_creditos" | "ocupado" | "rechazada" | "respuesta_invalida" | "red"; estadoHttp?: number };

export interface ClienteRealtime {
  readonly configurado: boolean;
  crearLlamada(sdp: string, sesion: Readonly<Record<string, unknown>>): Promise<ResultadoLlamada>;
  colgar(callId: string): Promise<void>;
}

/** Código de error legible por máquina del proveedor; nunca su mensaje. */
async function codigoDeError(respuesta: Response): Promise<string> {
  try {
    const cuerpo: unknown = await respuesta.json();
    if (typeof cuerpo === "object" && cuerpo !== null && "error" in cuerpo) {
      const error = cuerpo.error;
      if (typeof error === "object" && error !== null) {
        const codigo = "code" in error && typeof error.code === "string" ? error.code : "type" in error && typeof error.type === "string" ? error.type : null;
        if (codigo && /^[a-z0-9_]{1,64}$/.test(codigo)) return codigo;
      }
    }
  } catch {
    // Cuerpo no JSON.
  }
  return "desconocido";
}

export function idDeLlamada(location: string | null): string | null {
  if (!location) return null;
  try {
    const ruta = new URL(location, "https://api.openai.com").pathname;
    const id = ruta.split("/").filter(Boolean).at(-1) ?? "";
    return /^[A-Za-z0-9_-]{1,200}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function crearClienteRealtime(opciones: { apiKey: string | null; fetch?: typeof fetch; registrar?: Registrador }): ClienteRealtime {
  const { apiKey } = opciones;
  const solicitar = opciones.fetch ?? fetch;
  const registrar = opciones.registrar ?? registradorSilencioso;

  async function crearLlamada(sdp: string, sesion: Readonly<Record<string, unknown>>): Promise<ResultadoLlamada> {
    if (!apiKey) return { ok: false, tipo: "rechazada" };
    const formulario = new FormData();
    formulario.set("sdp", sdp);
    formulario.set("session", JSON.stringify(sesion));
    let respuesta: Response;
    try {
      respuesta = await solicitar(`${OPENAI}/realtime/calls`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formulario,
        signal: AbortSignal.timeout(TIEMPO_CREAR_MS),
      });
    } catch (error) {
      registrar("realtime_red_fallida", { tipo: error instanceof Error ? error.name : "desconocido" });
      return { ok: false, tipo: "red" };
    }
    if (!respuesta.ok) {
      const codigo = await codigoDeError(respuesta);
      registrar("realtime_rechazada", { estado: respuesta.status, codigo });
      if (codigo === "insufficient_quota") return { ok: false, tipo: "sin_creditos", estadoHttp: respuesta.status };
      if (respuesta.status === 429) return { ok: false, tipo: "ocupado", estadoHttp: respuesta.status };
      return { ok: false, tipo: "rechazada", estadoHttp: respuesta.status };
    }
    const callId = idDeLlamada(respuesta.headers.get("Location"));
    const respuestaSdp = await respuesta.text().catch(() => "");
    if (!callId || !respuestaSdp.startsWith("v=0")) {
      registrar("realtime_respuesta_invalida", { conId: callId !== null });
      // Si hubo llamada pero la respuesta no sirve, se cuelga para no dejarla abierta.
      if (callId) await colgar(callId);
      return { ok: false, tipo: "respuesta_invalida" };
    }
    return { ok: true, callId, sdp: respuestaSdp };
  }

  async function colgar(callId: string): Promise<void> {
    if (!apiKey) return;
    try {
      const respuesta = await solicitar(`${OPENAI}/realtime/calls/${encodeURIComponent(callId)}/hangup`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(TIEMPO_COLGAR_MS),
      });
      if (!respuesta.ok && respuesta.status !== 404) registrar("realtime_colgado_rechazado", { estado: respuesta.status });
    } catch (error) {
      registrar("realtime_colgado_fallido", { tipo: error instanceof Error ? error.name : "desconocido" });
    }
  }

  return { configurado: Boolean(apiKey), crearLlamada, colgar };
}
