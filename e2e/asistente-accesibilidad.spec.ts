import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { esperarTitulo, revisarAccesibilidad, sinDesplazamientoHorizontal } from "./helpers";

/**
 * Pekito: que no tape la navegación, que se use con teclado, que cumpla accesibilidad (axe) en sus
 * tres pantallas y que no deje animaciones infinitas con movimiento reducido. Sin red externa.
 */

const MASCOTA = { name: /Abrir Pekito/ };
const panel = (page: Page) => page.getByRole("dialog", { name: /PEKITO/i });

type Caja = { x: number; y: number; width: number; height: number };

function seCruzan(a: Caja, b: Caja): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

async function caja(page: Page, selector: string): Promise<Caja | null> {
  const localizador = page.locator(`${selector}:visible`);
  if ((await localizador.count()) === 0) return null;
  return localizador.first().boundingBox();
}

async function abrirChat(page: Page) {
  await page.getByRole("button", MASCOTA).click();
  await page.getByRole("button", { name: "Saltar" }).click();
  await expect(panel(page)).toBeVisible();
}

test.describe("Pekito · accesibilidad y layout", () => {
  // Independiente del servidor real: por omisión el estado del asistente dice «sin IA configurada»
  // (las pruebas con IA simulada registran su propia ruta después y ésta gana).
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/asistente/estado", (ruta) =>
      ruta.fulfill({
        json: { realtime: { disponible: false, motivo: "El asistente con IA no está configurado en este servidor (falta OPENAI_API_KEY). Puedes usar las respuestas programadas." }, clef: { disponible: false, modo: "off" }, bienestarIaReal: false },
      }),
    );
  });

  test("la mascota y la píldora nunca tapan la navegación (inferior o lateral)", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    const mascota = page.getByRole("button", MASCOTA);
    await expect(mascota).toBeVisible();
    const navegacion = '[aria-label="Principal"]';

    const verificar = async (etapa: string) => {
      const m = await mascota.boundingBox();
      const n = await caja(page, `nav${navegacion}`);
      expect(m, `mascota (${etapa})`).not.toBeNull();
      expect(n, `navegación (${etapa})`).not.toBeNull();
      if (m && n) expect(seCruzan(m, n), `la mascota no debe tapar la navegación (${etapa})`).toBe(false);
      const linea = await caja(page, '[data-guia="asistente.linea"]');
      if (m && n && linea && linea.width > 0) expect(seCruzan(linea, n), `la píldora no debe tapar la navegación (${etapa})`).toBe(false);
      // Siempre dentro de la ventana.
      const ventana = page.viewportSize();
      if (m && ventana) {
        expect(m.x).toBeGreaterThanOrEqual(0);
        expect(m.x + m.width).toBeLessThanOrEqual(ventana.width);
        expect(m.y + m.height).toBeLessThanOrEqual(ventana.height);
      }
    };

    await verificar("en reposo");
    await sinDesplazamientoHorizontal(page);

    // Con la píldora (acción y respuesta) y en el otro lado.
    await abrirChat(page);
    await panel(page).getByRole("textbox", { name: "Escribe a Pekito" }).fill("Quiero reportar un bache en la calle 60 del Centro");
    await panel(page).getByRole("button", { name: "Enviar", exact: true }).click();
    await expect(page.locator('[data-guia="asistente.linea"]')).toContainText("Listo: abrí", { timeout: 8000 });
    await verificar("con la píldora");
    await sinDesplazamientoHorizontal(page);

    await page.getByRole("button", { name: "Descartar mensaje de Pekito" }).click();
    await mascota.click();
    await panel(page).getByRole("button", { name: /^Mover Pekito al lado/ }).click();
    await panel(page).getByRole("button", { name: "Cerrar Pekito" }).click();
    await expect(panel(page)).toBeHidden();
    await expect(page.locator("[data-asistente-ui][data-lado]").first()).toHaveAttribute("data-lado", "izquierda");
    await verificar("en el lado izquierdo");
  });

  test("con el panel abierto no hay desplazamiento horizontal; como tarjeta (≥ 800 px) no tapa la navegación lateral", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    await abrirChat(page);
    await sinDesplazamientoHorizontal(page);
    const ancho = page.viewportSize()?.width ?? 1280;
    const p = await caja(page, '[data-guia="asistente.panel"]');
    expect(p).not.toBeNull();
    if (ancho >= 800 && p) {
      // Tarjeta no modal: la página sigue usable y la barra lateral queda libre.
      const lateral = await caja(page, 'nav[aria-label="Principal"]');
      if (lateral) expect(seCruzan(p, lateral)).toBe(false);
      await expect(panel(page)).not.toHaveAttribute("aria-modal", "true");
      await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Trámites y servicios", exact: true }).click();
      await expect(page).toHaveURL(/\/servicios$/);
    } else if (p) {
      // Pantalla completa en teléfono y tableta.
      expect(Math.round(p.width)).toBe(ancho);
    }
  });

  test("teclado: la mascota abre el panel, el foco queda dentro, Escape cierra y el foco regresa a la mascota", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    const mascota = page.getByRole("button", MASCOTA);
    await mascota.focus();
    await page.keyboard.press("Enter");
    const bienvenida = page.getByRole("dialog", { name: /Un agente que sí te atiende/ });
    await expect(bienvenida).toBeVisible();
    await expect(bienvenida.getByRole("heading", { name: /Un agente que sí te atiende/ })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(bienvenida).toBeHidden();

    // Con la bienvenida ya vista, el panel se abre con teclado.
    await expect(panel(page)).toBeVisible();
    await expect(panel(page).getByRole("heading", { name: "PEKITO", exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(panel(page)).toBeHidden();
    await expect(mascota).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(panel(page)).toBeVisible();
    const modal = (page.viewportSize()?.width ?? 1280) < 800;
    if (modal) {
      // Foco atrapado: tras muchas tabulaciones el foco sigue dentro del panel.
      for (let i = 0; i < 25; i += 1) await page.keyboard.press("Tab");
      expect(await page.evaluate(() => document.activeElement?.closest("dialog")?.matches("[data-asistente-ui]") ?? false)).toBe(true);
      for (let i = 0; i < 25; i += 1) await page.keyboard.press("Shift+Tab");
      expect(await page.evaluate(() => document.activeElement?.closest("dialog")?.matches("[data-asistente-ui]") ?? false)).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(panel(page)).toBeHidden();
    await expect(mascota).toBeFocused();
  });

  test("teclado: el compositor envía con Enter, agrega línea con Mayús + Enter y los chips no envían", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    await abrirChat(page);
    const campo = panel(page).getByRole("textbox", { name: "Escribe a Pekito" });
    await campo.focus();
    await page.keyboard.type("Hola");
    await page.keyboard.press("Shift+Enter");
    await page.keyboard.type("Pekito");
    await expect(campo).toHaveValue("Hola\nPekito");
    await expect(panel(page).getByRole("log")).not.toContainText("Hola");
    await page.keyboard.press("Enter");
    await expect(campo).toHaveValue("");
    await expect(panel(page).getByRole("log")).toContainText("Hola");
    // El botón Enviar se deshabilita mientras no hay texto (sin dobles envíos).
    await expect(panel(page).getByRole("button", { name: "Enviar", exact: true })).toBeDisabled();
  });

  test("Alt + flecha mueve a Pekito de lado con teclado", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    const mascota = page.getByRole("button", MASCOTA);
    await mascota.focus();
    await page.keyboard.press("Alt+ArrowLeft");
    await expect(page.locator("[data-asistente-ui][data-lado]").first()).toHaveAttribute("data-lado", "izquierda");
    await page.keyboard.press("Alt+ArrowRight");
    await expect(page.locator("[data-asistente-ui][data-lado]").first()).toHaveAttribute("data-lado", "derecha");
  });

  test("axe: la presencia, la bienvenida, el lanzador, el chat vacío y el chat con respuesta no tienen violaciones graves", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await revisarAccesibilidad(page);

    await page.getByRole("button", MASCOTA).click();
    await expect(page.getByRole("dialog", { name: /Un agente que sí te atiende/ })).toBeVisible();
    await revisarAccesibilidad(page);
    await page.getByRole("button", { name: "Saltar" }).click();
    await expect(panel(page)).toBeVisible();

    // Chat vacío (estado inicial del Figma 22:253).
    await expect(panel(page).getByRole("heading", { name: "Hola, soy Pekito" })).toBeVisible();
    await revisarAccesibilidad(page);

    // Lanzador «Por texto o por voz».
    await panel(page).getByRole("button", { name: /Volver a «Por texto o por voz»/ }).click();
    await expect(panel(page).getByRole("heading", { name: /Por texto\s+o por voz/ })).toBeVisible();
    await revisarAccesibilidad(page);

    // Chat con respuesta, fuentes y tarjeta de ayuda humana.
    await panel(page).getByRole("button", { name: /^Escribir/ }).click();
    await panel(page).getByRole("textbox", { name: "Escribe a Pekito" }).fill("Me quiero morir");
    await panel(page).getByRole("button", { name: "Enviar", exact: true }).click();
    await expect(panel(page).getByRole("heading", { name: "¿Necesitas ayuda ahora?" })).toBeVisible();
    await expect(panel(page).getByRole("log")).toContainText("Lo más importante ahora");
    await revisarAccesibilidad(page);
  });

  test("axe: las fuentes citadas y el recibo «preparado» son accesibles", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    await abrirChat(page);
    await panel(page).getByRole("textbox", { name: "Escribe a Pekito" }).fill("Quiero consultar el folio DEMO-R-9999999");
    await panel(page).getByRole("button", { name: "Enviar", exact: true }).click();
    await expect(page.getByText(/No encontré un reporte/).first()).toBeVisible();
    if (!(await panel(page).isVisible())) await page.getByRole("button", { name: MASCOTA.name }).click();
    await expect(panel(page).getByRole("log")).toContainText("No se pudo:");
    await revisarAccesibilidad(page);
  });

  test("el panel anuncia la conversación en una región viva y cada control tiene nombre accesible", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    await abrirChat(page);
    const log = panel(page).getByRole("log", { name: "Conversación con Pekito" });
    await expect(log).toHaveAttribute("aria-live", "polite");
    const sinNombre = await panel(page).evaluate((raiz) =>
      Array.from(raiz.querySelectorAll("button, a[href], textarea, input")).filter((el) => {
        const nombre = (el.getAttribute("aria-label") ?? "").trim() || (el.textContent ?? "").trim() || (el.id && raiz.querySelector(`label[for="${el.id}"]`)?.textContent?.trim()) || "";
        return nombre === "";
      }).length,
    );
    expect(sinNombre).toBe(0);
    // Objetivos táctiles de al menos 44 px en los controles del panel.
    const pequenos = await panel(page).evaluate((raiz) =>
      Array.from(raiz.querySelectorAll("button, a[href]"))
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 0 && (r.height < 43.5 || r.width < 43.5)).length,
    );
    expect(pequenos).toBe(0);
  });

  test("movimiento reducido: no quedan animaciones infinitas en ejecución en la presencia ni en el panel", async ({ page }, info) => {
    test.skip(info.project.name !== "movimiento-reducido", "Sólo aplica con «reducir movimiento» activado.");
    await page.goto("/");
    await esperarTitulo(page);
    const infinitas = () =>
      page.evaluate(() =>
        document
          .getAnimations()
          .filter((a) => a.playState === "running" && a.effect?.getComputedTiming().iterations === Infinity && a.effect.getComputedTiming().duration !== 0)
          .map((a) => (a.effect as KeyframeEffect | null)?.target?.className?.toString() ?? "")
          .filter((clase) => /pekito/.test(clase)),
      );
    expect(await infinitas()).toEqual([]);
    await page.getByRole("button", MASCOTA).click();
    await expect(page.getByRole("dialog", { name: /Un agente que sí te atiende/ })).toBeVisible();
    expect(await infinitas()).toEqual([]);
    await page.getByRole("button", { name: "Saltar" }).click();
    await panel(page).getByRole("button", { name: /Volver a «Por texto o por voz»/ }).click();
    await expect(panel(page).getByRole("heading", { name: /Por texto\s+o por voz/ })).toBeVisible();
    expect(await infinitas()).toEqual([]);
    expect(await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
  });
});
