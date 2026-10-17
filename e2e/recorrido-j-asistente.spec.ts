import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { esperarTitulo, sinDesplazamientoHorizontal } from "./helpers";

/**
 * Recorrido J: Pekito, el asistente global.
 * - Sin red externa: el asistente corre con «Respuestas programadas (demostración)» (reglas locales)
 *   y el servidor de OpenAI nunca se contacta. La parte de voz usa un TRANSPORTE FALSO (RTCPeerConnection
 *   y micrófono simulados en la página) sólo para probar la interfaz y el contrato con el runtime; no es IA real.
 * - Pekito prepara y abre; la persona confirma. Nunca inventa folios ni envía formularios.
 */

const MASCOTA = { name: /Abrir Pekito/ };

function panel(page: Page) {
  return page.getByRole("dialog", { name: /PEKITO/i });
}

/** Abre Pekito, salta la bienvenida (la primera vez) y deja la conversación escrita lista. */
async function abrirChat(page: Page) {
  await page.getByRole("button", MASCOTA).click();
  await page.getByRole("button", { name: "Saltar" }).click();
  await expect(panel(page)).toBeVisible();
  await expect(panel(page).getByRole("textbox", { name: "Escribe a Pekito" })).toBeVisible();
}

async function escribir(page: Page, texto: string) {
  const campo = panel(page).getByRole("textbox", { name: "Escribe a Pekito" });
  await campo.fill(texto);
  await panel(page).getByRole("button", { name: "Enviar", exact: true }).click();
}

/** Espera a que Pekito termine el turno (ya no «piensa» ni hay una acción en curso); el panel pudo ceder la pantalla. */
async function esperarTurno(page: Page) {
  await expect(page.getByText(/Pekito está pensando…|^Pensando…$|^Buscando en el catálogo…$|^Consultando|^Abriendo|^Preparando/)).toHaveCount(0, { timeout: 10_000 });
}

async function reabrir(page: Page) {
  await esperarTurno(page);
  if (!(await panel(page).isVisible())) await page.getByRole("button", MASCOTA).click();
  await expect(panel(page)).toBeVisible();
}

test.describe("Recorrido J · Pekito, el asistente global", () => {
  // Independiente del servidor real: por omisión el estado del asistente dice «sin IA configurada»
  // (las pruebas con IA simulada registran su propia ruta después y ésta gana).
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/asistente/estado", (ruta) =>
      ruta.fulfill({
        json: { realtime: { disponible: false, motivo: "El asistente con IA no está configurado en este servidor (falta OPENAI_API_KEY). Puedes usar las respuestas programadas." }, clef: { disponible: false, modo: "off" }, bienestarIaReal: false },
      }),
    );
  });

  test("la bienvenida es opcional y lleva al lanzador «Por texto o por voz» con la etiqueta de modo", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    await page.getByRole("button", MASCOTA).click();

    const bienvenida = page.getByRole("dialog", { name: /Un agente que sí te atiende/ });
    await expect(bienvenida).toBeVisible();
    await expect(bienvenida.getByText("Hola, puedes hablar", { exact: false }).first()).toBeAttached();
    await bienvenida.getByRole("button", { name: "Continuar" }).click();
    await expect(bienvenida.getByRole("radio", { name: /Escribir/ })).toBeChecked();
    // Sin servidor de IA, «Hablar» no se puede elegir y la bienvenida lo explica.
    await expect(bienvenida.getByRole("radio", { name: /Hablar/ })).toBeDisabled();
    await bienvenida.getByRole("button", { name: "Saltar" }).click();
    await expect(bienvenida).toBeHidden();

    // Segunda vez: no vuelve a salir sola. Con la conversación vacía abre el lanzador.
    await panel(page).getByRole("button", { name: "Cerrar Pekito" }).click();
    await expect(panel(page)).toBeHidden();
    await page.getByRole("button", MASCOTA).click();
    await expect(page.getByRole("dialog", { name: /Un agente que sí te atiende/ })).toBeHidden();
    const lanzador = panel(page);
    await expect(lanzador.getByRole("button", { name: /Volver a «Por texto o por voz»/ })).toHaveCount(0);
    await expect(lanzador.getByRole("heading", { name: /Por texto\s+o por voz/ })).toBeVisible();
    await expect(lanzador.getByText("Respuestas programadas (demostración)")).toBeVisible();
    await expect(lanzador.getByText(/Prototipo de demostración\. No realiza gestiones oficiales/i)).toBeVisible();
    await expect(lanzador.getByText(/no es un personaje oficial del Ayuntamiento/)).toBeVisible();

    // «Hablar» explica por qué no está disponible; «Escribir» abre el chat con el estado vacío del Figma.
    const hablar = lanzador.getByRole("button", { name: /^Hablar/ });
    await expect(hablar).toHaveAttribute("aria-disabled", "true");
    await expect(lanzador.getByText(/OPENAI_API_KEY/)).toBeVisible();
    await lanzador.getByRole("button", { name: /^Escribir/ }).click();
    await expect(lanzador.getByRole("heading", { name: "Hola, soy Pekito" })).toBeVisible();
    await expect(lanzador.getByRole("textbox", { name: "Escribe a Pekito" })).toBeFocused();
    await expect(lanzador.getByText(/Puede equivocarse; revisa las fuentes/)).toBeVisible();
    const sugerencias = lanzador.getByRole("list", { name: "Sugerencias para empezar" }).getByRole("button");
    await expect(sugerencias).toHaveText([
      "Reportar un bache",
      "Requisitos de un trámite",
      "Consultar mi folio",
      "Apoyo psicológico",
      "Trámite de mi negocio",
      "Actividades culturales",
    ]);
    await sinDesplazamientoHorizontal(page);
  });

  test("pide un bache: abre «Bache a la vista» preparado, NO lo envía solo y la persona confirma", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    await abrirChat(page);
    await expect(panel(page).getByText("Respuestas programadas (demostración)")).toBeVisible();

    // Las sugerencias prellenan; nunca envían solas.
    await panel(page).getByRole("button", { name: "Reportar un bache" }).click();
    await expect(panel(page).getByRole("textbox", { name: "Escribe a Pekito" })).toHaveValue("Quiero reportar un bache");
    await expect(panel(page).getByRole("log")).not.toContainText("Quiero reportar un bache");

    await escribir(page, "Quiero reportar un bache en la calle 60 del Centro");
    await expect(page).toHaveURL(/\/reportes\/nuevo\/bache$/);
    await expect(await esperarTitulo(page)).toHaveText("Bache a la vista");

    await test.step("formulario preparado, sin enviar", async () => {
      await expect(page.getByText("Preparado por el asistente: revisa y confirma")).toBeVisible();
      await expect(page.getByRole("textbox", { name: /Describe el problema/ })).toHaveValue("Un bache en la calle 60 del Centro.");
      await expect(page.getByText(/DEMO-R-\d{7}/)).toHaveCount(0);
      await expect(page.getByRole("dialog", { name: "Tu folio de reporte es:" })).toHaveCount(0);
      // Sigue en el paso 1: el envío todavía no existe.
      await expect(page.getByRole("heading", { level: 2, name: "Describe la incidencia" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Enviar a la simulación" })).toHaveCount(0);
    });

    await test.step("Pekito cede la pantalla y cuenta qué hizo en una línea", async () => {
      await expect(panel(page)).toBeHidden({ timeout: 8000 });
      await expect(page.getByRole("status").filter({ hasText: /Listo: abrí «Bache a la vista»/ })).toBeVisible();
    });

    await test.step("el historial conserva el recibo con «Revisar y confirmar»", async () => {
      await reabrir(page);
      const tarjeta = panel(page).getByRole("region", { name: /Preparado para que lo revises: Bache a la vista/ });
      await expect(tarjeta).toBeVisible();
      await expect(tarjeta.getByText("Preparado · falta tu confirmación")).toBeVisible();
      await expect(tarjeta.getByText(/Nada se envía hasta que tú lo confirmes/)).toBeVisible();
      await expect(panel(page).getByRole("log")).toContainText("Quiero reportar un bache en la calle 60 del Centro");
      await tarjeta.getByRole("button", { name: "Revisar y confirmar" }).click();
      await expect(panel(page)).toBeHidden();
      await expect(page).toHaveURL(/\/reportes\/nuevo\/bache$/);
    });

    await test.step("la persona confirma: recorre el formulario y es ELLA quien lo envía", async () => {
      await page.getByRole("button", { name: "Continuar" }).click();
      await expect(page.getByRole("heading", { level: 2, name: "Confirma la ubicación" })).toBeFocused();
      // La referencia que dio la persona llegó como sugerencia, pero la ubicación se confirma aquí.
      await expect(page.getByRole("textbox", { name: /^Calle/ })).toHaveValue("60");
      await expect(page.getByRole("combobox", { name: /Colonia o comisaría/ })).toHaveValue("centro");
      // Lo que falta (un cruzamiento) lo pone la persona: Pekito no inventa la ubicación.
      await page.getByRole("button", { name: "Continuar" }).click();
      await expect(page.getByRole("textbox", { name: /Cruzamiento 1/ })).toBeFocused();
      await page.getByRole("textbox", { name: /Cruzamiento 1/ }).fill("59");
      await page.getByRole("textbox", { name: /Cruzamiento 2/ }).fill("61");
      await page.getByRole("button", { name: "Continuar" }).click();
      await expect(page.getByRole("heading", { level: 2, name: "Agrega una fotografía (opcional)" })).toBeVisible();
      await page.getByRole("button", { name: "Continuar" }).click();
      await expect(page.getByRole("heading", { level: 2, name: "Revisa si ya lo reportaron" })).toBeVisible();
      await page.getByRole("button", { name: "Continuar" }).click();
      await expect(page.getByRole("heading", { level: 2, name: "Revisa tu reporte" })).toBeVisible();
      await expect(page.getByText(/DEMO-R-\d{7}/)).toHaveCount(0);
      await page.getByRole("button", { name: "Enviar a la simulación" }).click();
      const dialogo = page.getByRole("dialog", { name: "Tu folio de reporte es:" });
      await expect(dialogo.locator("[data-folio]")).toHaveText(/^DEMO-R-\d{7}$/);
    });
  });

  test("requisitos de un trámite: busca en el catálogo, propone y muestra los requisitos con su fuente y estado de información", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    await abrirChat(page);

    await escribir(page, "Necesito saber qué documentos pide este trámite");
    await expect(panel(page).getByRole("log")).toContainText("¿De qué trámite?");
    await escribir(page, "licencia de funcionamiento");
    await expect(page).toHaveURL(/\/buscar\?q=/);
    // En pantalla completa el panel cede el paso al actuar; se reabre para seguir la conversación.
    await reabrir(page);
    await expect(panel(page).getByRole("log")).toContainText("¿Quieres que te muestre los requisitos de");

    await escribir(page, "sí");
    await expect(page).toHaveURL(/\/servicios\/[^/]+$/);
    await reabrir(page);
    const fuentes = panel(page).getByText("Fuentes citadas").first();
    await expect(fuentes).toBeVisible();
    // Cada fuente trae su estado de información (nunca se completan requisitos ni costos por cuenta propia).
    await expect(panel(page).locator("[data-info]").first()).toBeVisible();
    await expect(panel(page).getByText(/Consultada el/).first()).toBeVisible();
    await expect(panel(page).getByRole("button", { name: "Ver ficha en la app" }).first()).toBeVisible();
  });

  test("consultar un folio que no existe: no inventa folios y dice «No se pudo»", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    await abrirChat(page);

    await escribir(page, "Quiero consultar el folio DEMO-R-9999999");
    await reabrir(page);
    const log = panel(page).getByRole("log");
    await expect(log).toContainText("No se pudo:");
    await expect(log).toContainText("No encontré un reporte con el folio DEMO-R-9999999");
    // Ningún otro folio aparece en la conversación.
    const texto = (await log.textContent()) ?? "";
    expect(texto.match(/DEMO-[A-Z]-\d+/g)?.filter((folio) => folio !== "DEMO-R-9999999") ?? []).toEqual([]);
  });

  test("ante una señal de riesgo muestra ayuda humana primero, con 911 y líneas verificadas", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    await abrirChat(page);

    await escribir(page, "Me quiero morir");
    const ayuda = panel(page).getByRole("heading", { name: "¿Necesitas ayuda ahora?" });
    await expect(ayuda).toBeVisible();
    await expect(panel(page).getByRole("link", { name: /Llamar al 911/ })).toHaveAttribute("href", "tel:911");
    // El texto de Pekito llega después de la tarjeta de ayuda.
    const orden = await panel(page)
      .getByRole("log")
      .evaluate((log) => {
        const ayudaEl = log.querySelector("h3");
        const respuesta = Array.from(log.querySelectorAll("p")).find((p) => /Lo más importante ahora/.test(p.textContent ?? ""));
        if (!ayudaEl || !respuesta) return null;
        return Boolean(ayudaEl.compareDocumentPosition(respuesta) & Node.DOCUMENT_POSITION_FOLLOWING);
      });
    expect(orden).toBe(true);
    await panel(page).getByRole("button", { name: "Ver líneas de ayuda" }).click();
    await expect(page.getByRole("dialog", { name: "Ayuda inmediata" })).toBeVisible();
  });

  test("Pekito no aparece en salud mental ni en Línea Mujer y libera el espacio reservado", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    await expect(page.getByRole("button", MASCOTA)).toBeVisible();
    const espacio = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--espacio-asistente").trim());
    expect(await espacio()).not.toBe("0px");

    for (const ruta of ["/bienestar/salud-mental", "/bienestar/linea-mujer"]) {
      await page.goto(ruta);
      await esperarTitulo(page);
      await expect(page.getByRole("button", MASCOTA)).toHaveCount(0);
      await expect(page.locator("[data-asistente-ui]")).toHaveCount(0);
      expect(await espacio()).toBe("0px");
    }
    await page.goto("/bienestar");
    await esperarTitulo(page);
    await expect(page.getByRole("button", MASCOTA)).toBeVisible();
  });

  test("al pedir apoyo psicológico lo lleva a Salud mental, donde Pekito ya no está", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    await abrirChat(page);
    await escribir(page, "Busco apoyo psicológico");
    await expect(page).toHaveURL(/\/bienestar\/salud-mental$/);
    await esperarTitulo(page);
    await expect(page.getByRole("button", MASCOTA)).toHaveCount(0);
    await expect(panel(page)).toHaveCount(0);
  });

  test("señala un control con un cursor guía que vuela desde Pekito (anillo en táctil y con movimiento reducido)", async ({ page }, info) => {
    await page.goto("/");
    await esperarTitulo(page);
    await abrirChat(page);
    await escribir(page, "¿Dónde está el mapa?");

    const señal = await page.waitForSelector(".pekito-cursor-guia, .pekito-anillo-guia", { state: "attached", timeout: 8000 });
    const clase = (await señal.getAttribute("class")) ?? "";
    // Escritorio con puntero fino: cursor. Teléfono (táctil) y movimiento reducido: anillo, sin vuelo.
    const esperaCursor = info.project.name === "escritorio" || info.project.name === "tableta";
    expect(clase.includes("pekito-cursor-guia")).toBe(esperaCursor);
    await expect(page).toHaveURL(/\/mapa$/);
    await expect(page.locator(".pekito-cursor-guia, .pekito-anillo-guia")).toHaveCount(0, { timeout: 8000 });
  });

  test("cualquier toque de la persona cancela la señal del cursor", async ({ page }, info) => {
    test.skip(info.project.name !== "escritorio", "El cursor guía sólo vuela con puntero fino y sin movimiento reducido.");
    await page.goto("/");
    await esperarTitulo(page);
    await abrirChat(page);
    await escribir(page, "¿Dónde está el mapa?");
    await page.waitForSelector(".pekito-cursor-guia", { state: "attached", timeout: 8000 });
    await page.mouse.click(700, 500);
    await expect(page.locator(".pekito-cursor-guia, .pekito-anillo-guia")).toHaveCount(0);
  });

  test.describe("con OpenAI Realtime disponible (transporte simulado en la página; no es IA real)", () => {
    /** Simula lo mínimo de WebRTC y del micrófono, y deja a la prueba hablar por el canal de eventos. */
    async function simularRealtime(page: Page) {
      await page.route("**/api/asistente/estado", (ruta) =>
        ruta.fulfill({
          json: { realtime: { disponible: true, modelo: "modelo-de-prueba" }, clef: { disponible: false, modo: "off" }, bienestarIaReal: false },
        }),
      );
      await page.route("**/api/asistente/conexiones", (ruta) =>
        ruta.request().method() === "POST"
          ? ruta.fulfill({ status: 201, json: { id: "conexion-de-prueba-123456", sdp: "v=0\r\no=- respuesta", modelo: "modelo-de-prueba", maxSegundos: 900 } })
          : ruta.fulfill({ status: 204 }),
      );
      await page.route("**/api/asistente/conexiones/*", (ruta) => ruta.fulfill({ status: 204 }));
      await page.addInitScript(() => {
        interface CanalFalso extends EventTarget {
          readyState: string;
          onmessage: ((evento: { data: string }) => void) | null;
          onclose: (() => void) | null;
          send(datos: string): void;
          close(): void;
        }
        const enviados: Array<Record<string, unknown>> = [];
        const ventana = window as unknown as Record<string, unknown>;
        ventana.__enviadosAlModelo = enviados;
        class PeerFalso {
          connectionState = "new";
          onconnectionstatechange: (() => void) | null = null;
          ontrack: unknown = null;
          canal: CanalFalso | null = null;
          addTrack() {
            return { replaceTrack: async () => undefined };
          }
          addTransceiver() {
            return { sender: { replaceTrack: async () => undefined } };
          }
          createDataChannel() {
            const canal = Object.assign(new EventTarget(), {
              readyState: "connecting",
              onmessage: null,
              onclose: null,
              send: (datos: string) => {
                enviados.push(JSON.parse(datos) as Record<string, unknown>);
              },
              close: () => undefined,
            }) as CanalFalso;
            this.canal = canal;
            ventana.__servidorFalso = (evento: unknown) => canal.onmessage?.({ data: JSON.stringify(evento) });
            return canal;
          }
          async createOffer() {
            return { type: "offer", sdp: "v=0\r\no=- oferta" };
          }
          async setLocalDescription() {
            return undefined;
          }
          async setRemoteDescription() {
            setTimeout(() => {
              if (!this.canal) return;
              this.canal.readyState = "open";
              this.canal.dispatchEvent(new Event("open"));
              // Pista remota simulada (el audio del asistente).
              const flujo = new AudioContext().createMediaStreamDestination().stream;
              const pista = flujo.getAudioTracks()[0];
              if (typeof this.ontrack === "function") (this.ontrack as (evento: unknown) => void)({ streams: [flujo], track: pista });
            }, 0);
          }
          close() {
            return undefined;
          }
        }
        ventana.RTCPeerConnection = PeerFalso;
        // Micrófono simulado: un flujo de audio local sin permisos.
        Object.defineProperty(navigator, "mediaDevices", {
          configurable: true,
          value: {
            getUserMedia: async () => {
              const contexto = new AudioContext();
              return contexto.createMediaStreamDestination().stream;
            },
          },
        });
      });
    }

    const servidor = (page: Page, evento: unknown) => page.evaluate((valor) => (window as unknown as { __servidorFalso: (e: unknown) => void }).__servidorFalso(valor), evento);

    test("elección explícita del proveedor, etiqueta «Conectado», actuación con recibo y llamada de voz", async ({ page }) => {
      await simularRealtime(page);
      await page.goto("/");
      await esperarTitulo(page);
      await page.getByRole("button", MASCOTA).click();
      await page.getByRole("button", { name: "Saltar" }).click();
      await panel(page).getByRole("button", { name: /Volver a «Por texto o por voz»/ }).click();

      await test.step("por omisión sigue en demostración; Hablar pide elegir la IA real", async () => {
        await expect(panel(page).getByText("Respuestas programadas (demostración)").first()).toBeVisible();
        await expect(panel(page).getByRole("radio", { name: /Respuestas programadas/ })).toBeChecked();
        await expect(panel(page).getByRole("button", { name: /^Hablar/ })).toHaveAttribute("aria-disabled", "true");
        await expect(panel(page).getByText(/elige «IA con OpenAI Realtime»/)).toBeVisible();
      });

      await test.step("al elegir la IA real, la etiqueta pasa a «sin conectar» hasta que haya sesión", async () => {
        await panel(page).getByRole("radio", { name: /IA con OpenAI Realtime/ }).check();
        await expect(panel(page).getByText("OpenAI Realtime (sin conectar)")).toBeVisible();
        await expect(panel(page).getByRole("button", { name: /^Hablar/ })).not.toHaveAttribute("aria-disabled", "true");
      });

      await test.step("llamada de voz: mascota, estado, silenciar y colgar", async () => {
        await panel(page).getByRole("button", { name: /^Hablar/ }).click();
        await expect(panel(page).getByText("Conectado a OpenAI Realtime")).toBeVisible();
        await expect(panel(page).getByRole("status").filter({ hasText: "Te escucho" })).toBeVisible();
        const silenciar = panel(page).getByRole("button", { name: "Silenciar micrófono" });
        await silenciar.click();
        await expect(panel(page).getByRole("button", { name: "Activar micrófono" })).toHaveAttribute("aria-pressed", "true");
        await expect(panel(page).getByRole("status").filter({ hasText: "Micrófono silenciado" })).toBeVisible();
        await panel(page).getByRole("button", { name: "Activar micrófono" }).click();

        // El asistente habla: subtítulos y estado.
        await servidor(page, { type: "output_audio_buffer.started" });
        await servidor(page, { type: "response.created", response: { id: "r1" } });
        await servidor(page, { type: "response.output_audio_transcript.delta", item_id: "m1", delta: "Claro, te ayudo con ese reporte." });
        await expect(panel(page).getByText("Claro, te ayudo con ese reporte.")).toBeVisible();
        await expect(panel(page).getByRole("status").filter({ hasText: "Pekito está hablando" })).toBeVisible();
        await servidor(page, {
          type: "response.done",
          response: { id: "r1", status: "completed", output: [{ id: "m1", type: "message", content: [{ type: "output_audio", transcript: "Claro, te ayudo con ese reporte." }] }] },
        });
      });

      await test.step("el modelo pide preparar un reporte: se ejecuta con el runtime y devuelve el recibo, sin enviar", async () => {
        await servidor(page, { type: "response.created", response: { id: "r2" } });
        await servidor(page, {
          type: "response.function_call_arguments.done",
          call_id: "llamada-1",
          name: "prepararReporte",
          arguments: JSON.stringify({ categoria: "bache", descripcion: "Bache profundo frente a la escuela." }),
        });
        await servidor(page, { type: "response.done", response: { id: "r2", status: "completed", output: [] } });
        await expect(page).toHaveURL(/\/reportes\/nuevo\/bache$/);
        await expect(page.getByRole("textbox", { name: /Describe el problema/ })).toHaveValue("Bache profundo frente a la escuela.");
        await expect(page.getByText(/DEMO-R-\d{7}/)).toHaveCount(0);
        // La llamada sigue en pie, con «Colgar» en la píldora, y el modelo recibió el recibo (no «completada»).
        await expect(page.getByRole("button", { name: "Colgar" })).toBeVisible();
        const salida = await page.evaluate(() => {
          const enviados = (window as unknown as { __enviadosAlModelo: Array<{ item?: { type?: string; call_id?: string; output?: string } }> }).__enviadosAlModelo;
          return enviados.find((evento) => evento.item?.type === "function_call_output" && evento.item.call_id === "llamada-1")?.item?.output ?? null;
        });
        expect(salida).not.toBeNull();
        expect(JSON.parse(salida ?? "{}")).toMatchObject({ estado: "preparada_para_confirmar" });
        expect(salida).not.toMatch(/DEMO-R-/);
      });

      await test.step("colgar vuelve al chat y conserva la conversación", async () => {
        await page.getByRole("button", { name: "Colgar" }).click();
        await expect(page.getByRole("button", { name: "Colgar" })).toHaveCount(0);
        await reabrir(page);
        await expect(panel(page).getByRole("textbox", { name: "Escribe a Pekito" })).toBeVisible();
        await expect(panel(page).getByRole("log")).toContainText("Claro, te ayudo con ese reporte.");
        await expect(panel(page).getByRole("region", { name: /Preparado para que lo revises: Bache a la vista/ })).toBeVisible();
      });
    });

    test.describe("error del servidor al abrir la sesión", () => {
      // El navegador registra en consola toda respuesta 503; aquí es justo lo que se está simulando.
      test.use({ erroresPermitidos: [/status of 503/] });

      test("el aviso es legible, no finge una conexión y la demostración sigue disponible", async ({ page }) => {
        await simularRealtime(page);
        await page.route("**/api/asistente/conexiones", (ruta) =>
          ruta.request().method() === "POST"
            ? ruta.fulfill({ status: 503, json: { error: "El asistente con IA no está configurado en este servidor.", codigo: "sin_configuracion" } })
            : ruta.fulfill({ status: 204 }),
        );
        await page.goto("/");
        await esperarTitulo(page);
        await page.getByRole("button", MASCOTA).click();
        await page.getByRole("button", { name: "Saltar" }).click();
        await panel(page).getByRole("button", { name: /Volver a «Por texto o por voz»/ }).click();
        await panel(page).getByRole("radio", { name: /IA con OpenAI Realtime/ }).check();
        await panel(page).getByRole("button", { name: /^Escribir/ }).click();
        await escribir(page, "Hola");
        await expect(panel(page).getByText("La IA no está configurada en este servidor")).toBeVisible();
        await expect(panel(page).getByText("El asistente con IA no está configurado en este servidor.")).toBeVisible();
        // Nunca simula una conexión real que no existe.
        await expect(panel(page).getByText("Conectado a OpenAI Realtime")).toHaveCount(0);
        await expect(panel(page).getByText("OpenAI Realtime (sin conectar)")).toBeVisible();
      });
    });
  });
});
