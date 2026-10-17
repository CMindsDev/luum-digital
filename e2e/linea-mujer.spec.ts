import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { esperarTitulo, navegarA, revisarAccesibilidad, sinDesplazamientoHorizontal } from "./helpers";

/**
 * Línea Mujer: consultar información ≠ abrir canal oficial (llamada con confirmación, no se marca en
 * pruebas) ≠ simular una solicitud. Salida rápida con botón y con Escape dos veces.
 */

const RUTA = "/bienestar/linea-mujer";
const DESTINO_NEUTRAL = /^https:\/\/www\.google\.com\//;

/** La página neutral se sirve localmente: las pruebas no salen a la red. */
async function interceptarDestinoNeutral(page: Page) {
  await page.route("https://www.google.com/**", (ruta) =>
    ruta.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: "<!doctype html><title>Google</title><p>Página neutral</p>" }),
  );
}

test.describe("Línea Mujer", () => {
  test("separa información, canal oficial y simulación; llamar requiere confirmar", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    await navegarA(page, "bienestar");
    await page.locator("[data-guia='bienestar.linea_mujer']").click();
    await expect(page).toHaveURL(new RegExp(`${RUTA}$`));
    const h1 = await esperarTitulo(page);
    await expect(h1).toHaveText("Línea Mujer");

    await expect(page.getByRole("heading", { level: 2, name: "Consultar información" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Abrir el canal oficial" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Simular una solicitud" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Refugio y atención integral/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "App oficial «Línea Mujer»" })).toBeVisible();
    await expect(page.getByText(/no la integra ni la probó/)).toBeVisible();

    // Antes de confirmar no existe ningún enlace para marcar a Línea Mujer.
    await expect(page.locator("a[href='tel:8004557672']")).toHaveCount(0);
    await page.locator("[data-guia='linea_mujer.llamar']").click();
    const dialogo = page.getByRole("dialog", { name: "¿Llamar a Línea Mujer?" });
    await expect(dialogo).toBeVisible();
    // El enlace existe tras la confirmación explícita; en pruebas NO se toca (no se marca).
    await expect(dialogo.getByRole("link", { name: /Llamar al 800 455 76 72/ })).toHaveAttribute("href", "tel:8004557672");
    await expect(dialogo.getByText(/no envía alertas, ubicación ni mensajes/)).toBeVisible();
    await dialogo.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialogo).toBeHidden();

    // Simulación rotulada: no envía nada.
    await page.locator("[data-guia='linea_mujer.solicitud_simulada']").click();
    await expect(page.getByText("Solicitud simulada: nadie la ha recibido.")).toBeVisible();
    await expect(page.getByText(/no hay cita, seguimiento ni persona asignada/)).toBeVisible();

    await sinDesplazamientoHorizontal(page);
  });

  test("la salida rápida reemplaza la página por una neutral y explica sus límites", async ({ page }) => {
    await interceptarDestinoNeutral(page);
    await page.goto("/bienestar");
    await esperarTitulo(page);
    await page.locator("[data-guia='bienestar.linea_mujer']").click();
    await esperarTitulo(page);
    await expect(page.getByText(/No borra tu historial de navegación ni garantiza ocultar tu actividad/)).toBeVisible();

    await page.locator("[data-guia='linea_mujer.salida_rapida']").click();
    await expect(page).toHaveURL(DESTINO_NEUTRAL);
    await expect(page.getByText("Página neutral")).toBeVisible();

    // location.replace: «Atrás» no regresa a Línea Mujer, sino a la página anterior (por eso no borra el historial).
    await page.goBack();
    await expect(page).toHaveURL(/\/bienestar$/);
  });

  test("Escape dos veces activa la salida rápida", async ({ page }) => {
    await interceptarDestinoNeutral(page);
    await page.goto(RUTA);
    await esperarTitulo(page);
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(DESTINO_NEUTRAL);
  });

  test("ayuda inmediata con Línea Mujer después del 911 y sin violaciones de accesibilidad graves", async ({ page }) => {
    await page.goto(RUTA);
    await esperarTitulo(page);
    await expect(page.getByRole("heading", { name: /Atención Especializada/ })).toBeVisible();
    await sinDesplazamientoHorizontal(page);
    await revisarAccesibilidad(page);

    await page.locator("[data-guia='linea_mujer.ayuda_inmediata']").click();
    const hoja = page.getByRole("dialog", { name: "Ayuda inmediata" });
    const llamadas = hoja.getByRole("link", { name: /Llamar/ });
    await expect(llamadas.nth(0)).toHaveAttribute("href", "tel:911");
    await expect(llamadas.nth(1)).toHaveAttribute("href", "tel:8004557672");
  });
});
