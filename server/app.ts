/**
 * Aplicación Hono del servidor ligero. Único lugar con claves de proveedores (OpenAI, Cloudflare).
 * `createApp` no lee el entorno ni abre puertos: recibe la configuración y dependencias inyectables
 * (fetch, reloj, registro) para probarla sin red.
 */
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { routePath } from "hono/route";
import { CODIGOS_ERROR } from "../shared/asistente/servidor";
import { RegistroLlamadas, type Temporizador } from "./asistente/llamadas";
import { rutasAsistente } from "./asistente/rutas";
import type { ConfiguracionServidor } from "./config";
import { crearClienteClef } from "./proveedores/clef";
import { crearClienteRealtime } from "./proveedores/openai-realtime";
import { crearRegistradorConsola, type Registrador } from "./registro";
import { cabecerasApi, LimitadorVentana, respuestaError, sinCache, verificarOrigen } from "./seguridad";

/** Cuerpo máximo de cualquier solicitud a la API (la oferta SDP ocupa unos pocos KB). */
export const LIMITE_CUERPO_BYTES = 96 * 1024;
/** Consultas a las guardas por IP y minuto. */
export const LIMITE_GUARDAS_POR_MINUTO = 60;

export interface DependenciasServidor {
  /** fetch hacia los proveedores (OpenAI, Cloudflare). En pruebas, un doble sin red. */
  fetch?: typeof fetch;
  registrar?: Registrador;
  ahora?: () => number;
  temporizador?: Temporizador;
}

export type AppServidor = Hono & {
  /** Cuelga las llamadas abiertas (al apagar el servidor). */
  cerrar: () => Promise<void>;
};

export function createApp(config: ConfiguracionServidor, dependencias: DependenciasServidor = {}): AppServidor {
  const registrar = dependencias.registrar ?? crearRegistradorConsola();
  const ahora = dependencias.ahora ?? Date.now;
  const fetchProveedores = dependencias.fetch ?? fetch;

  const clef = crearClienteClef({
    cuentaId: config.cloudflareAccountId,
    token: config.cloudflareAiToken,
    modelo: config.clefModelo,
    timeoutMs: config.clefTimeoutMs,
    fetch: fetchProveedores,
    registrar,
    ahora,
  });
  const realtime = crearClienteRealtime({ apiKey: config.openaiApiKey, fetch: fetchProveedores, registrar });
  const llamadas = new RegistroLlamadas({
    maxSimultaneas: config.maxLlamadasSimultaneas,
    maxSegundos: config.maxSegundos,
    colgar: (callId) => realtime.colgar(callId),
    ahora,
    ...(dependencias.temporizador ? { temporizador: dependencias.temporizador } : {}),
  });

  const app = new Hono();

  // Registro sin contenido: método, patrón de ruta (sin ids ni consultas), estado y duración.
  app.use("*", async (c, next) => {
    const inicio = ahora();
    await next();
    registrar("solicitud", { metodo: c.req.method, ruta: routePath(c, -1) || "desconocida", estado: c.res.status, ms: ahora() - inicio });
  });
  app.use("/api/*", cabecerasApi());
  app.use("/api/asistente/*", sinCache());
  app.use("/api/*", verificarOrigen(config.origenesPermitidos));
  app.use(
    "/api/*",
    bodyLimit({
      maxSize: LIMITE_CUERPO_BYTES,
      onError: (c) => respuestaError(c, 413, { error: "La solicitud es demasiado grande.", codigo: CODIGOS_ERROR.cuerpoGrande }),
    }),
  );

  app.get("/api/salud", (c) => c.json({ ok: true }));
  app.route(
    "/api/asistente",
    rutasAsistente({
      config,
      clef,
      realtime,
      llamadas,
      limitadorInicios: new LimitadorVentana({ limite: config.maxIniciosHora, ventanaMs: 60 * 60 * 1000, ahora }),
      limitadorGuardas: new LimitadorVentana({ limite: LIMITE_GUARDAS_POR_MINUTO, ventanaMs: 60 * 1000, ahora }),
      registrar,
      ahora,
    }),
  );

  app.notFound((c) => respuestaError(c, 404, { error: "Ruta no encontrada.", codigo: CODIGOS_ERROR.noEncontrada }));
  app.onError((error, c) => {
    registrar("error_no_controlado", { tipo: error.name });
    return respuestaError(c, 500, { error: "Ocurrió un error inesperado en el servidor.", codigo: CODIGOS_ERROR.interno });
  });

  return Object.assign(app, { cerrar: () => llamadas.cerrarTodas() });
}
