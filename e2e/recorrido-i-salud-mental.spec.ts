import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { esperarTitulo, navegarA, revisarAccesibilidad, sinDesplazamientoHorizontal } from "./helpers";

/**
 * Recorrido I (brief §13): entrar a salud mental, usar la conversación de demostración y localizar
 * apoyo humano. La ayuda inmediata funciona sin chat y la conversación no persiste.
 */

const RUTA = "/bienestar/salud-mental";
const ROTULO = "Acompañante de demostración (simulación). No es una persona profesional ni un personaje oficial del Ayuntamiento.";

function registro(page: Page) {
  return page.getByRole("log", { name: /Conversación con el acompañante/ });
}

async function escribir(page: Page, texto: string) {
  const campo = page.getByRole("textbox", { name: "Escribe tu mensaje" });
  await campo.fill(texto);
  await campo.press("Enter");
}

async function almacenamiento(page: Page): Promise<string> {
  return page.evaluate(() => {
    const partes: string[] = [];
    for (const almacen of [window.localStorage, window.sessionStorage]) {
      for (let indice = 0; indice < almacen.length; indice += 1) {
        const clave = almacen.key(indice) ?? "";
        partes.push(clave, almacen.getItem(clave) ?? "");
      }
    }
    return partes.join("\n");
  });
}

test.describe("Recorrido I · Salud mental", () => {
  test("entra desde Bienestar, conversa en demostración y localiza apoyo humano", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    const h1Bienestar = await navegarA(page, "bienestar");
    await expect(h1Bienestar).toHaveText("Salud y Bienestar");

    await page.locator("[data-guia='bienestar.salud_mental']").click();
    await expect(page).toHaveURL(new RegExp(`${RUTA}$`));
    const h1 = await esperarTitulo(page);
    await expect(h1).toHaveText("Salud mental");
    await expect(h1).toBeFocused();
    await expect(page.getByText(ROTULO)).toBeVisible();

    // Conversación de demostración (escenarios programados del ámbito bienestar).
    await page.locator("[data-guia='salud_mental.hablar']").click();
    await expect(registro(page).getByText(/Gracias por darte este espacio/)).toBeVisible();
    await expect(registro(page).getByText(/no doy diagnósticos/)).toBeVisible();

    // Localizar apoyo humano desde la conversación.
    await escribir(page, "Quiero encontrar atención");
    await expect(registro(page).getByText(/Te mostré los canales y lugares de atención verificados/)).toBeVisible();
    const almaNova = page.getByRole("heading", { name: "Apoyo Psicológico (centros Alma Nova)" });
    await expect(almaNova).toBeVisible();
    await expect(page.getByRole("link", { name: /Ficha MID-BIH-007/ }).first()).toHaveAttribute("href", /detalle-tramite\/7$/);
    await expect(page.getByRole("link", { name: "psicologia@merida.gob.mx" })).toHaveAttribute("href", "mailto:psicologia@merida.gob.mx");

    // Solicitud simulada: nunca dice que alguien la recibió.
    await page.locator("[data-guia='salud_mental.solicitud_simulada']").click();
    await expect(page.getByText("Solicitud simulada: nadie la ha recibido.")).toBeVisible();

    // Ayuda inmediata: 911 primero y líneas humanas verificadas.
    await page.locator("[data-guia='salud_mental.ayuda_inmediata']").click();
    const hoja = page.getByRole("dialog", { name: "Ayuda inmediata" });
    await expect(hoja).toBeVisible();
    await expect(hoja.getByRole("link", { name: /Llamar/ }).first()).toHaveAttribute("href", "tel:911");
    await expect(hoja.getByRole("heading", { name: "Línea de la Vida (CONASAMA)" })).toBeVisible();
    await expect(hoja.getByRole("heading", { name: "Línea Mujer" })).toBeVisible();
    await hoja.getByRole("button", { name: "Cerrar" }).click();
    await expect(hoja).toBeHidden();

    // Nada de la conversación en la URL.
    expect(new URL(page.url()).search).toBe("");
    await sinDesplazamientoHorizontal(page);
  });

  test("la ayuda inmediata funciona sin conversar y sigue visible al desplazarse", async ({ page }) => {
    await page.goto(RUTA);
    await esperarTitulo(page);
    await page.getByRole("heading", { name: "Sobre este espacio" }).scrollIntoViewIfNeeded();
    const boton = page.locator("[data-guia='salud_mental.ayuda_inmediata']");
    await expect(boton).toBeInViewport();
    await boton.click();
    const hoja = page.getByRole("dialog", { name: "Ayuda inmediata" });
    await expect(hoja.getByRole("link", { name: /Llamar al 911/ })).toHaveAttribute("href", "tel:911");
    await expect(hoja.getByRole("heading", { name: /Alma Nova/ })).toBeVisible();
    await expect(registro(page).getByText(/Acompañante/)).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(hoja).toBeHidden();

    // La entrada «Necesito ayuda inmediata» también abre la ayuda sin pasar por el chat.
    await page.locator("[data-guia='salud_mental.necesito_ayuda']").click();
    await expect(hoja).toBeVisible();
  });

  test("ante palabras de riesgo muestra ayuda humana de inmediato", async ({ page }) => {
    await page.goto(RUTA);
    await esperarTitulo(page);
    await escribir(page, "ya no quiero vivir");
    const hoja = page.getByRole("dialog", { name: "Ayuda inmediata" });
    await expect(hoja).toBeVisible();
    await expect(hoja.getByRole("link", { name: /Llamar/ }).first()).toHaveAttribute("href", "tel:911");
    await hoja.getByRole("button", { name: "Cerrar" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Lo más importante ahora es hablar con una persona" })).toBeVisible();
  });

  test("la conversación no persiste tras recargar ni queda en el almacenamiento", async ({ page }) => {
    const mensaje = "Mensaje de prueba número 4821";
    await page.goto(RUTA);
    await esperarTitulo(page);
    await escribir(page, mensaje);
    await expect(registro(page).getByText(mensaje)).toBeVisible();
    await expect(registro(page).getByText(/Puedo acompañarte con alguna de estas opciones/)).toBeVisible();
    expect(await almacenamiento(page)).not.toContain("4821");

    await page.reload();
    await esperarTitulo(page);
    await expect(page.getByText(mensaje)).toHaveCount(0);
    expect(await almacenamiento(page)).not.toContain("4821");

    // «Borrar conversación» también la elimina sin recargar.
    await escribir(page, "Otro mensaje 9930");
    await expect(registro(page).getByText("Otro mensaje 9930")).toBeVisible();
    await page.locator("[data-guia='salud_mental.borrar_conversacion']").click();
    await expect(page.getByText("Otro mensaje 9930")).toHaveCount(0);
  });

  test("salud mental y bienestar sin violaciones de accesibilidad graves", async ({ page }) => {
    await page.goto(RUTA);
    await esperarTitulo(page);
    await expect(page.getByRole("heading", { name: "Apoyo Psicológico (centros Alma Nova)" })).toBeVisible();
    await sinDesplazamientoHorizontal(page);
    await revisarAccesibilidad(page);

    await page.goto("/bienestar");
    await esperarTitulo(page);
    await expect(page.getByRole("heading", { name: /Apoyo Psicológico/ })).toBeVisible();
    await sinDesplazamientoHorizontal(page);
    await revisarAccesibilidad(page);
  });
});
