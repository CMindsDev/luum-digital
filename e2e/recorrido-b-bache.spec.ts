import { expect, test } from "./fixtures";
import { esperarTitulo, navegarA, revisarAccesibilidad, sinDesplazamientoHorizontal, TEXTO_ROTULO_DEMO } from "./helpers";

/**
 * Recorrido B: «Bache a la vista» con ubicación escrita → folio DEMO-R → aparece en «Mis reportes».
 * Komchén (comisaría) está fuera de la zona de las semillas: no hay posibles duplicados.
 */
test.describe("Recorrido B · Bache a la vista", () => {
  test("reporta un bache con ubicación manual y lo encuentra en Mis reportes", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    await navegarA(page, "reportes");

    await test.step("hub de reportes con la estructura de Mérida Móvil", async () => {
      await expect(page.getByRole("heading", { name: "Reportes rápidos" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Catálogo de reportes" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Mis reportes" })).toBeVisible();
      await sinDesplazamientoHorizontal(page);
      await revisarAccesibilidad(page);
    });

    await page.locator('[data-guia="reportes.bache_a_la_vista"]').click();
    await expect(page).toHaveURL(/\/reportes\/nuevo\/bache$/);
    await expect(await esperarTitulo(page)).toHaveText("Bache a la vista");
    await expect(page.getByRole("link", { name: new RegExp(TEXTO_ROTULO_DEMO) })).toBeVisible();

    await test.step("1 · describir (15 a 300 caracteres)", async () => {
      await page.getByRole("button", { name: "Continuar" }).click();
      const descripcion = page.getByRole("textbox", { name: /Describe el problema/ });
      await expect(descripcion).toBeFocused();
      await expect(descripcion).toHaveAttribute("aria-invalid", "true");
      await descripcion.fill("Bache grande en el carril derecho, frente a la tienda de la esquina.");
      await expect(page.getByRole("heading", { name: "Asistencia simulada" })).toBeVisible();
      await sinDesplazamientoHorizontal(page);
      // Arriba del todo: axe marca «target-size» si el botón regresar queda bajo el encabezado fijo al desplazarse.
      await page.evaluate(() => window.scrollTo(0, 0));
      await revisarAccesibilidad(page);
      await page.getByRole("button", { name: "Continuar" }).click();
    });

    await test.step("2 · ubicación escrita (aproximada)", async () => {
      await expect(page.getByRole("heading", { level: 2, name: "Confirma la ubicación" })).toBeFocused();
      await expect(page.getByRole("radio", { name: /Escribir la dirección/ })).toBeChecked();
      await page.getByRole("combobox", { name: /Colonia o comisaría/ }).selectOption("komchen");
      await page.getByRole("textbox", { name: /^Calle/ }).fill("21");
      await page.getByRole("textbox", { name: /Cruzamiento 1/ }).fill("20");
      await page.getByRole("textbox", { name: /Cruzamiento 2/ }).fill("22");
      await expect(page.getByText(/Ubicación aproximada:/)).toBeVisible();
      await sinDesplazamientoHorizontal(page);
      await page.getByRole("button", { name: "Continuar" }).click();
    });

    await test.step("3 · foto opcional con aviso de seguridad", async () => {
      await expect(page.getByRole("heading", { level: 2, name: "Agrega una fotografía (opcional)" })).toBeVisible();
      await expect(page.getByText(/No te expongas al tránsito/)).toBeVisible();
      await page.getByRole("button", { name: "Continuar" }).click();
    });

    await test.step("4 · sin posibles duplicados", async () => {
      await expect(page.getByText("No encontramos reportes iguales abiertos cerca.")).toBeVisible();
      await page.getByRole("button", { name: "Continuar" }).click();
    });

    let folio = "";
    await test.step("5 a 7 · revisar, enviar a la simulación y recibir el folio", async () => {
      await expect(page.getByRole("heading", { level: 2, name: "Revisa tu reporte" })).toBeVisible();
      await expect(page.getByText("Calle 21 x 20 y 22, Komchén", { exact: true })).toBeVisible();
      await sinDesplazamientoHorizontal(page);
      await revisarAccesibilidad(page);
      await page.getByRole("button", { name: "Enviar a la simulación" }).click();
      const dialogo = page.getByRole("dialog", { name: "Tu folio de reporte es:" });
      await expect(dialogo).toBeVisible();
      const textoFolio = dialogo.locator("[data-folio]");
      await expect(textoFolio).toHaveText(/^DEMO-R-\d{7}$/);
      folio = (await textoFolio.textContent()) ?? "";
      await expect(dialogo.getByText("Dale seguimiento en «Mis reportes».")).toBeVisible();
      await expect(dialogo.getByText(/quedan pendientes/)).toBeVisible();
      await dialogo.getByRole("button", { name: "Aceptar" }).click();
    });

    await test.step("aparece en Mis reportes como «Registrado»", async () => {
      await expect(page).toHaveURL(/\/reportes\/mis-reportes$/);
      await expect(await esperarTitulo(page)).toHaveText("Mis reportes");
      const grupo = page.locator('section[data-estado="registrado"]');
      await expect(grupo.getByRole("link", { name: new RegExp(`folio ${folio}`) })).toBeVisible();
      await sinDesplazamientoHorizontal(page);
      await revisarAccesibilidad(page);
      await grupo.getByRole("link", { name: new RegExp(`folio ${folio}`) }).click();
      await expect(await esperarTitulo(page)).toHaveText("Bache");
      await expect(page.locator("[data-folio]")).toHaveText(folio);
      await expect(page.getByRole("link", { name: "Ver en el mapa" })).toHaveAttribute("href", /\/mapa\?reporte=/);
    });
  });
});
