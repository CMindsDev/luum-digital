// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { accionesDelAmbito } from "../shared/asistente/acciones";
import type { PantallaActual } from "../shared/asistente/pantalla";
import { EstadoServidorSchema, RespuestaConexionSchema, RespuestaGuardaAccionSchema } from "../shared/asistente/servidor";
import { createApp, type DependenciasServidor } from "./app";
import type { Temporizador } from "./asistente/llamadas";
import { leerConfiguracion, type ConfiguracionServidor } from "./config";
import type { Registrador, ValorRegistro } from "./registro";

const ORIGEN = "http://localhost:5173";
const CLAVE_OPENAI = "sk-prueba-secreta-1234567890";
const TOKEN_CLOUDFLARE = "cf-token-secreto-1234567890";
const CUENTA_CLOUDFLARE = "cuentaprueba123";
const ID_LLAMADA_PROVEEDOR = "rtc_secreto_proveedor_123";
const SDP_OFERTA = "v=0\r\no=- 46117317 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n";
const SDP_RESPUESTA = "v=0\r\no=- 99 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=respuesta\r\n";

const PANTALLA: PantallaActual = {
  ruta: "/reportes",
  titulo: "Reportes",
  seccion: "reportes",
  rol: "ciudadania",
  objetivos: [{ id: "reportes.bache_a_la_vista", etiqueta: "Bache a la vista" }],
  dialogoAbierto: null,
  formulario: null,
};

function configuracion(cambios: Partial<ConfiguracionServidor> = {}): ConfiguracionServidor {
  return { ...leerConfiguracion({}).config, ...cambios };
}

function conClaves(cambios: Partial<ConfiguracionServidor> = {}): ConfiguracionServidor {
  return configuracion({
    openaiApiKey: CLAVE_OPENAI,
    cloudflareAccountId: CUENTA_CLOUDFLARE,
    cloudflareAiToken: TOKEN_CLOUDFLARE,
    ...cambios,
  });
}

function urlDe(entrada: Parameters<typeof fetch>[0]): string {
  if (typeof entrada === "string") return entrada;
  if (entrada instanceof URL) return entrada.href;
  return entrada.url;
}

interface OpcionesProveedorFalso {
  noulClef?: number;
  estadoOpenAi?: number;
  cuerpoErrorOpenAi?: unknown;
}

/** fetch de proveedores sin red: OpenAI Realtime (crear y colgar) y Clef. */
function proveedoresFalsos(opciones: OpcionesProveedorFalso = {}) {
  return vi.fn<typeof fetch>(async (entrada) => {
    const url = urlDe(entrada);
    if (url === "https://api.openai.com/v1/realtime/calls") {
      if (opciones.estadoOpenAi) {
        return new Response(JSON.stringify(opciones.cuerpoErrorOpenAi ?? { error: { code: "server_error" } }), {
          status: opciones.estadoOpenAi,
        });
      }
      return new Response(SDP_RESPUESTA, {
        status: 201,
        headers: { Location: `/v1/realtime/calls/${ID_LLAMADA_PROVEEDOR}`, "Content-Type": "application/sdp" },
      });
    }
    if (url.endsWith("/hangup")) return new Response(null, { status: 200 });
    if (url.startsWith("https://api.cloudflare.com/")) {
      return new Response(
        JSON.stringify({
          result: {
            answers: {
              solicitada: { type: "noul", noul: opciones.noulClef ?? 0.9 },
              categoria: {
                type: "choice",
                choice: "reporte_ciudadano",
                probabilities: { reporte_ciudadano: 0.8, consulta_tramite: 0.15, conversacion: 0.05 },
              },
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    throw new Error(`Red bloqueada en pruebas: ${url}`);
  });
}

function registroEnMemoria() {
  const eventos: { evento: string; datos: Readonly<Record<string, ValorRegistro>> }[] = [];
  const registrar: Registrador = (evento, datos = {}) => {
    eventos.push({ evento, datos });
  };
  return { eventos, registrar };
}

function temporizadorManual() {
  const programadas: { funcion: () => void; ms: number; cancelada: boolean }[] = [];
  const temporizador: Temporizador = {
    programar(funcion, ms) {
      const entrada = { funcion, ms, cancelada: false };
      programadas.push(entrada);
      return () => {
        entrada.cancelada = true;
      };
    },
  };
  return { programadas, temporizador };
}

function crear(config: ConfiguracionServidor, dependencias: DependenciasServidor = {}) {
  return createApp(config, { registrar: registroEnMemoria().registrar, fetch: proveedoresFalsos(), ...dependencias });
}

function post(ruta: string, cuerpo: unknown, cabeceras: Record<string, string> = {}): [string, RequestInit] {
  return [
    ruta,
    {
      method: "POST",
      headers: { Origin: ORIGEN, "Content-Type": "application/json", ...cabeceras },
      body: JSON.stringify(cuerpo),
    },
  ];
}

function solicitudConexion(cambios: Record<string, unknown> = {}) {
  return post("/api/asistente/conexiones", { ambito: "general", sdp: SDP_OFERTA, pantalla: PANTALLA, ...cambios });
}

describe("GET /api/asistente/estado", () => {
  it("sin claves informa que nada está disponible, con motivo legible y sin caché", async () => {
    const app = crear(configuracion());
    const respuesta = await app.request("/api/asistente/estado");
    expect(respuesta.status).toBe(200);
    expect(respuesta.headers.get("Cache-Control")).toContain("no-store");
    const estado = EstadoServidorSchema.parse(await respuesta.json());
    expect(estado.realtime.disponible).toBe(false);
    expect(estado.realtime.motivo).toMatch(/OPENAI_API_KEY/);
    expect(estado.realtime.modelo).toBeUndefined();
    expect(estado.clef).toEqual({ disponible: false, modo: "shadow" });
    expect(estado.bienestarIaReal).toBe(false);
  });

  it("con claves informa el modelo y nunca las claves", async () => {
    const app = crear(conClaves());
    const texto = await (await app.request("/api/asistente/estado")).text();
    const estado = EstadoServidorSchema.parse(JSON.parse(texto));
    expect(estado.realtime).toEqual({ disponible: true, modelo: "gpt-realtime-2.1" });
    expect(estado.clef.disponible).toBe(true);
    expect(texto).not.toContain(CLAVE_OPENAI);
    expect(texto).not.toContain(TOKEN_CLOUDFLARE);
    expect(texto).not.toContain(CUENTA_CLOUDFLARE);
  });
});

describe("POST /api/asistente/conexiones", () => {
  it("sin clave responde 503 explícito y no llama al proveedor", async () => {
    const proveedores = proveedoresFalsos();
    const app = crear(configuracion(), { fetch: proveedores });
    const respuesta = await app.request(...solicitudConexion());
    expect(respuesta.status).toBe(503);
    expect(await respuesta.json()).toMatchObject({ codigo: "sin_configuracion" });
    expect(proveedores).not.toHaveBeenCalled();
  });

  it("crea la llamada con el modelo, la pantalla y sólo las herramientas del ámbito general", async () => {
    const proveedores = proveedoresFalsos();
    const app = crear(conClaves({ maxSegundos: 600 }), { fetch: proveedores });
    const respuesta = await app.request(...solicitudConexion());
    expect(respuesta.status).toBe(201);
    const cuerpo = RespuestaConexionSchema.parse(await respuesta.json());
    expect(cuerpo.sdp).toBe(SDP_RESPUESTA);
    expect(cuerpo.modelo).toBe("gpt-realtime-2.1");
    expect(cuerpo.maxSegundos).toBe(600);
    expect(cuerpo.id).not.toContain(ID_LLAMADA_PROVEEDOR);

    expect(proveedores).toHaveBeenCalledTimes(1);
    const [url, init] = proveedores.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://api.openai.com/v1/realtime/calls");
    expect(new Headers(init?.headers).get("Authorization")).toBe(`Bearer ${CLAVE_OPENAI}`);
    const formulario = init?.body;
    if (!(formulario instanceof FormData)) throw new Error("Se esperaba multipart");
    expect(formulario.get("sdp")).toBe(SDP_OFERTA);
    const sesion = JSON.parse(String(formulario.get("session")));
    expect(sesion).toMatchObject({
      type: "realtime",
      model: "gpt-realtime-2.1",
      output_modalities: ["text"],
      audio: {
        input: { transcription: { model: "gpt-4o-mini-transcribe", language: "es" }, noise_reduction: { type: "near_field" } },
        output: { voice: "marin" },
      },
    });
    expect(sesion.instructions).toContain("[Pantalla actual]");
    expect(sesion.instructions).toContain("reportes.bache_a_la_vista");
    const nombres = sesion.tools.map((herramienta: { name: string }) => herramienta.name);
    expect(nombres.sort()).toEqual([...accionesDelAmbito("general")].sort());
    for (const herramienta of sesion.tools) {
      expect(herramienta.type).toBe("function");
      expect(herramienta.parameters.$schema).toBeUndefined();
    }
  });

  it("en bienestar exige la bandera BIENESTAR_IA_REAL y el consentimiento explícito", async () => {
    const sinBandera = crear(conClaves({ bienestarIaReal: false }));
    const respuestaSinBandera = await sinBandera.request(...solicitudConexion({ ambito: "bienestar", consentimientoBienestar: true }));
    expect(respuestaSinBandera.status).toBe(403);
    expect(await respuestaSinBandera.json()).toMatchObject({ codigo: "bienestar_ia_desactivada" });

    const sinConsentimiento = crear(conClaves({ bienestarIaReal: true }));
    const respuestaSinConsentimiento = await sinConsentimiento.request(...solicitudConexion({ ambito: "bienestar" }));
    expect(respuestaSinConsentimiento.status).toBe(403);
    expect(await respuestaSinConsentimiento.json()).toMatchObject({ codigo: "consentimiento_requerido" });

    // Sin clave también se rechaza por política antes que por configuración.
    const sinClave = crear(configuracion({ bienestarIaReal: false }));
    expect((await sinClave.request(...solicitudConexion({ ambito: "bienestar" }))).status).toBe(403);
  });

  it("en bienestar con bandera y consentimiento declara sólo las dos herramientas permitidas", async () => {
    const proveedores = proveedoresFalsos();
    const app = crear(conClaves({ bienestarIaReal: true }), { fetch: proveedores });
    const respuesta = await app.request(...solicitudConexion({ ambito: "bienestar", consentimientoBienestar: true }));
    expect(respuesta.status).toBe(201);
    const formulario = proveedores.mock.calls[0]?.[1]?.body;
    if (!(formulario instanceof FormData)) throw new Error("Se esperaba multipart");
    const sesion = JSON.parse(String(formulario.get("session")));
    expect(sesion.tools.map((herramienta: { name: string }) => herramienta.name).sort()).toEqual(["mostrarApoyoHumano", "senalarElemento"]);
    expect(sesion.instructions).toContain("acompañante de demostración");
    expect(sesion.instructions).toContain("No diagnosticas");
  });

  it("rechaza una pantalla que excede los límites con 422 y otros cuerpos inválidos con 400", async () => {
    const app = crear(conClaves());
    const objetivos = Array.from({ length: 41 }, (_, indice) => ({ id: `x.${indice}`, etiqueta: "X" }));
    const pantallaInvalida = await app.request(...solicitudConexion({ pantalla: { ...PANTALLA, objetivos } }));
    expect(pantallaInvalida.status).toBe(422);
    const sdpInvalido = await app.request(...solicitudConexion({ sdp: "esto no es SDP" }));
    expect(sdpInvalido.status).toBe(400);
    const ambitoInvalido = await app.request(...solicitudConexion({ ambito: "administracion" }));
    expect(ambitoInvalido.status).toBe(400);
  });

  it("traduce la falta de créditos del proveedor a 503 con pausa", async () => {
    const proveedores = proveedoresFalsos({ estadoOpenAi: 429, cuerpoErrorOpenAi: { error: { code: "insufficient_quota" } } });
    const app = crear(conClaves(), { fetch: proveedores });
    const primera = await app.request(...solicitudConexion());
    expect(primera.status).toBe(503);
    expect(primera.headers.get("Retry-After")).toBe("60");
    expect(await primera.json()).toMatchObject({ codigo: "sin_creditos" });
    // Durante la pausa no se vuelve a llamar al proveedor.
    const segunda = await app.request(...solicitudConexion());
    expect(segunda.status).toBe(503);
    expect(proveedores).toHaveBeenCalledTimes(1);
    const estado = EstadoServidorSchema.parse(await (await app.request("/api/asistente/estado")).json());
    expect(estado.realtime.disponible).toBe(false);
  });

  it("limita los inicios por IP y hora", async () => {
    const app = crear(conClaves({ maxIniciosHora: 1 }));
    const entorno = { incoming: { socket: { remoteAddress: "10.0.0.7" } } };
    const [ruta, init] = solicitudConexion();
    expect((await app.request(ruta, init, entorno)).status).toBe(201);
    const [ruta2, init2] = solicitudConexion();
    const segunda = await app.request(ruta2, init2, entorno);
    expect(segunda.status).toBe(429);
    expect(Number(segunda.headers.get("Retry-After"))).toBeGreaterThan(0);
    // Otra IP conserva su cupo.
    const [ruta3, init3] = solicitudConexion();
    expect((await app.request(ruta3, init3, { incoming: { socket: { remoteAddress: "10.0.0.8" } } })).status).toBe(201);
  });

  it("cuelga en el proveedor al cerrar la conexión y al vencer el tiempo máximo", async () => {
    const proveedores = proveedoresFalsos();
    const { programadas, temporizador } = temporizadorManual();
    const app = crear(conClaves({ maxSegundos: 120 }), { fetch: proveedores, temporizador });

    const primera = RespuestaConexionSchema.parse(await (await app.request(...solicitudConexion())).json());
    const cerrar = await app.request(`/api/asistente/conexiones/${primera.id}`, { method: "DELETE", headers: { Origin: ORIGEN } });
    expect(cerrar.status).toBe(204);
    expect(proveedores.mock.calls.map(([url]) => String(url))).toContain(
      `https://api.openai.com/v1/realtime/calls/${ID_LLAMADA_PROVEEDOR}/hangup`,
    );
    const otraVez = await app.request(`/api/asistente/conexiones/${primera.id}`, { method: "DELETE", headers: { Origin: ORIGEN } });
    expect(otraVez.status).toBe(404);

    await app.request(...solicitudConexion());
    const vencimiento = programadas.at(-1);
    expect(vencimiento?.ms).toBe(120_000);
    const colgadosAntes = proveedores.mock.calls.filter(([url]) => String(url).endsWith("/hangup")).length;
    vencimiento?.funcion();
    await vi.waitFor(() => {
      expect(proveedores.mock.calls.filter(([url]) => String(url).endsWith("/hangup")).length).toBe(colgadosAntes + 1);
    });
  });
});

describe("guardas", () => {
  const guardaReporte = (mensajes: { rol: "persona" | "asistente"; texto: string }[]) =>
    post("/api/asistente/guardas/accion", {
      accion: "prepararReporte",
      argumentos: { categoria: "bache" },
      mensajesRecientes: mensajes,
    });

  it("sin Clef responde sin señal", async () => {
    const app = crear(configuracion());
    const respuesta = await app.request(...guardaReporte([{ rol: "persona", texto: "Quiero reportar un bache" }]));
    expect(respuesta.status).toBe(200);
    expect(RespuestaGuardaAccionSchema.parse(await respuesta.json())).toEqual({
      probabilidad: null,
      decision: "sin_senal",
      modo: "shadow",
      aplica: true,
    });
  });

  it("no consulta Clef para acciones que no son de nivel B", async () => {
    const proveedores = proveedoresFalsos();
    const app = crear(conClaves(), { fetch: proveedores });
    const respuesta = await app.request(
      ...post("/api/asistente/guardas/accion", { accion: "navegar", argumentos: { seccion: "mapa" }, mensajesRecientes: [] }),
    );
    expect(await respuesta.json()).toMatchObject({ aplica: false, decision: "sin_senal", probabilidad: null });
    expect(proveedores).not.toHaveBeenCalled();
  });

  it("en shadow siempre permite pero informa la probabilidad; en enforce pide preguntar bajo 0,3", async () => {
    const { eventos, registrar } = registroEnMemoria();
    const sombra = createApp(conClaves({ guardas: "shadow" }), { fetch: proveedoresFalsos({ noulClef: 0.1 }), registrar });
    const mensajes = [{ rol: "persona" as const, texto: "¿Qué es un bache?" }];
    expect(await (await sombra.request(...guardaReporte(mensajes))).json()).toEqual({
      probabilidad: 0.1,
      decision: "permitir",
      modo: "shadow",
      aplica: true,
    });
    expect(JSON.stringify(eventos)).not.toContain("¿Qué es un bache?");

    const estricta = crear(conClaves({ guardas: "enforce" }), { fetch: proveedoresFalsos({ noulClef: 0.1 }) });
    expect(await (await estricta.request(...guardaReporte(mensajes))).json()).toMatchObject({ decision: "preguntar", modo: "enforce" });

    const pedida = crear(conClaves({ guardas: "enforce" }), { fetch: proveedoresFalsos({ noulClef: 0.9 }) });
    expect(await (await pedida.request(...guardaReporte(mensajes))).json()).toMatchObject({ decision: "permitir", probabilidad: 0.9 });
  });

  it("valida el tamaño de los mensajes recientes", async () => {
    const app = crear(conClaves());
    const largo = [{ rol: "persona" as const, texto: "x".repeat(401) }];
    expect((await app.request(...guardaReporte(largo))).status).toBe(400);
    const muchos = Array.from({ length: 7 }, () => ({ rol: "persona" as const, texto: "hola" }));
    expect((await app.request(...guardaReporte(muchos))).status).toBe(400);
  });

  it("clasifica la intención con Clef o devuelve null sin él", async () => {
    const conClef = crear(conClaves(), { fetch: proveedoresFalsos() });
    const respuesta = await conClef.request(...post("/api/asistente/guardas/intencion", { texto: "Hay un bache enorme" }));
    expect(await respuesta.json()).toEqual({
      categoria: "reporte_ciudadano",
      probabilidades: { reporte_ciudadano: 0.8, consulta_tramite: 0.15, conversacion: 0.05 },
      modo: "shadow",
    });
    const sinClef = crear(configuracion());
    expect(await (await sinClef.request(...post("/api/asistente/guardas/intencion", { texto: "Hola" }))).json()).toEqual({
      categoria: null,
      probabilidades: {},
      modo: "shadow",
    });
  });
});

describe("seguridad", () => {
  it("rechaza escrituras con un origen no permitido o sin origen", async () => {
    const app = crear(conClaves());
    const ajeno = await app.request(...solicitudConexion());
    expect(ajeno.status).toBe(201);
    const [ruta, init] = post("/api/asistente/conexiones", {}, { Origin: "https://sitio-ajeno.example" });
    const respuesta = await app.request(ruta, init);
    expect(respuesta.status).toBe(403);
    expect(await respuesta.json()).toMatchObject({ codigo: "origen_no_permitido" });
    const sinOrigen = await app.request("/api/asistente/guardas/intencion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: "hola" }),
    });
    expect(sinOrigen.status).toBe(403);
  });

  it("exige JSON y limita el tamaño del cuerpo", async () => {
    const app = crear(conClaves());
    const texto = await app.request("/api/asistente/guardas/intencion", {
      method: "POST",
      headers: { Origin: ORIGEN, "Content-Type": "text/plain" },
      body: JSON.stringify({ texto: "hola" }),
    });
    expect(texto.status).toBe(415);
    const enorme = await app.request(...post("/api/asistente/guardas/intencion", { texto: "x".repeat(200_000) }));
    expect(enorme.status).toBe(413);
  });

  it("ninguna respuesta ni registro incluye secretos, SDP, pantallas ni mensajes", async () => {
    const { eventos, registrar } = registroEnMemoria();
    const app = createApp(conClaves({ guardas: "enforce", bienestarIaReal: true }), { fetch: proveedoresFalsos(), registrar });
    const respuestas = await Promise.all([
      app.request("/api/salud"),
      app.request("/api/asistente/estado"),
      app.request(...solicitudConexion()),
      app.request(...solicitudConexion({ ambito: "bienestar", consentimientoBienestar: true })),
      app.request(...post("/api/asistente/guardas/accion", { accion: "prepararReporte", argumentos: { categoria: "bache" }, mensajesRecientes: [{ rol: "persona", texto: "mensaje privado 42" }] })),
      app.request(...post("/api/asistente/guardas/intencion", { texto: "mensaje privado 43" })),
      app.request("/api/no-existe"),
    ]);
    const textos = await Promise.all(respuestas.map((respuesta) => respuesta.text()));
    for (const texto of textos) {
      expect(texto).not.toContain(CLAVE_OPENAI);
      expect(texto).not.toContain(TOKEN_CLOUDFLARE);
      expect(texto).not.toContain(CUENTA_CLOUDFLARE);
      expect(texto).not.toContain(ID_LLAMADA_PROVEEDOR);
    }
    const registro = JSON.stringify(eventos);
    for (const prohibido of [CLAVE_OPENAI, TOKEN_CLOUDFLARE, CUENTA_CLOUDFLARE, ID_LLAMADA_PROVEEDOR, "mensaje privado", "a=respuesta", "46117317", "Bache a la vista"]) {
      expect(registro).not.toContain(prohibido);
    }
    expect(eventos.some((evento) => evento.evento === "solicitud" && evento.datos.ruta === "/api/asistente/conexiones")).toBe(true);
  });
});
