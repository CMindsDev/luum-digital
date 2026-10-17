import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { cambiarIdentidad, esperarTitulo, navegarA, revisarAccesibilidad, sinDesplazamientoHorizontal, TEXTO_ROTULO_DEMO } from "./helpers";

/** Despliega «Mostrar más» hasta que el elemento exista en la cola (la cola es larga y está paginada). */
async function revelar(page: Page, selector: string) {
  const objetivo = page.locator(selector);
  // Espera a que lleguen los datos (si no, aún no hay botón «Mostrar más» y el ciclo terminaría antes).
  await page.locator("[data-reporte]").first().waitFor();
  for (let i = 0; i < 10 && (await objetivo.count()) === 0; i += 1) {
    const mas = page.getByRole("button", { name: /^Mostrar (más|todos)/ });
    if ((await mas.count()) === 0) break;
    await mas.click();
  }
  await expect(objetivo).toBeVisible();
  return objetivo;
}

/**
 * Recorrido D: como operador, registrar la atención de un reporte «En proceso de atención».
 * El reporte pasa a «Solucionado» (atención reportada) y abre la verificación ciudadana.
 */
test.describe("Recorrido D · Operador de demostración", () => {
  test("registra la atención de un reporte en proceso", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);

    await test.step("la ciudadanía no ve la sección y se le explica cómo cambiar de identidad", async () => {
      await expect(page.getByRole("link", { name: "Operador de demostración" })).toHaveCount(0);
      await page.goto("/operador");
      await expect((await esperarTitulo(page))).toHaveText("Operador de demostración");
      await expect(page.getByRole("heading", { name: "Esta vista es para la operación de demostración" })).toBeVisible();
      await expect(page.getByRole("link", { name: /Cambiar de identidad en «Cuenta»/ })).toHaveAttribute("href", "/cuenta");
      await expect(page.getByRole("button", { name: /Registrar atención/ })).toHaveCount(0);
    });

    await cambiarIdentidad(page, "Carmen Dzib");
    await navegarA(page, "operador");

    await test.step("aviso de demostración, rótulo y criterios explícitos de prioridad", async () => {
      await expect(page.getByRole("link", { name: new RegExp(TEXTO_ROTULO_DEMO) })).toBeVisible();
      const aviso = page.getByRole("note").filter({ hasText: "Vista de demostración" });
      await expect(aviso).toContainText("no es seguridad ni autorización de producción");
      await expect(aviso).toContainText("la validación y el saldo se controlan en el servidor");
      await expect(page.getByText(/No depende de cuántas personas reportan ni de puntos/)).toBeVisible();
      await expect(page.locator("#contenido h1")).toHaveCount(1);
      await sinDesplazamientoHorizontal(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      await revisarAccesibilidad(page);
    });

    await test.step("la cola muestra el motivo de la prioridad", async () => {
      await page.getByRole("radio", { name: "En proceso" }).click();
      const tarjeta = await revelar(page, '[data-reporte="rep-0007"]');
      await expect(tarjeta).toContainText("DEMO-R-0000007");
      await expect(tarjeta).toContainText("En proceso de atención");
      await expect(tarjeta).toContainText("Prioridad alta");
      await expect(tarjeta.getByRole("list", { name: "Criterios de la prioridad" })).toContainText("declaró un riesgo");
    });

    await test.step("registrar atención con nota", async () => {
      await page.locator('[data-guia="operador.registrar_atencion_rep-0007"]').click();
      const dialogo = page.getByRole("dialog", { name: "Registrar atención de DEMO-R-0000007" });
      await expect(dialogo).toBeVisible();
      await expect(dialogo).toContainText("abre la verificación ciudadana");
      await dialogo.getByRole("textbox", { name: /Nota de atención/ }).fill("Se rellenó el bache (nota de demostración).");
      await dialogo.getByRole("button", { name: "Registrar atención" }).click();
      await expect(dialogo).toBeHidden();
    });

    await test.step("sale de la cola y queda en el registro de la visita", async () => {
      await expect(page.locator('[data-reporte="rep-0007"]')).toHaveCount(0);
      await page.getByRole("tab", { name: /^Registro/ }).click();
      const entrada = page.locator("[data-accion-registrada]").first();
      await expect(entrada).toContainText("DEMO-R-0000007: atención registrada");
      await expect(entrada).toContainText("Solucionado");
      await sinDesplazamientoHorizontal(page);
    });

    await test.step("el reporte queda «Solucionado» con verificación pendiente (ejes separados)", async () => {
      await page.getByRole("link", { name: "Ver DEMO-R-0000007" }).click();
      await expect(page).toHaveURL(/\/reportes\/rep-0007$/);
      const estatus = page.getByRole("region", { name: "Estatus" });
      await expect(estatus.getByText("Solucionado", { exact: true })).toBeVisible();
      await expect(estatus.getByText("Verificación pendiente")).toBeVisible();
      await expect(page.getByText(/Atención reportada por el Ayuntamiento \(simulado\)/)).toBeVisible();
    });
  });

  test("validar un reporte registrado y cancelar otro exige motivo", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    await cambiarIdentidad(page, "Carmen Dzib");
    await navegarA(page, "operador");
    await page.getByRole("radio", { name: "Registrados" }).click();

    const validar = await revelar(page, '[data-guia="operador.validar_rep-0005"]');
    await validar.click();
    const confirmacion = page.getByRole("dialog", { name: "¿Validar DEMO-R-0000005?" });
    await expect(confirmacion).toContainText("En proceso de atención");
    await confirmacion.getByRole("button", { name: "Validar reporte" }).click();
    await expect(confirmacion).toBeHidden();
    // Sale de «Registrados» y pasa a «En proceso» (el estado municipal lo cambia sólo el operador).
    await expect(page.locator('[data-reporte="rep-0005"]')).toHaveCount(0);
    await page.getByRole("radio", { name: "En proceso" }).click();
    await expect(await revelar(page, '[data-reporte="rep-0005"]')).toContainText("En proceso de atención");
    await page.getByRole("radio", { name: "Registrados" }).click();

    // Cancelar siempre con motivo: sin elegirlo, el formulario lo pide.
    await (await revelar(page, '[data-guia="operador.cancelar_rep-0001"]')).click();
    const cancelacion = page.getByRole("dialog", { name: "Cancelar DEMO-R-0000001" });
    await cancelacion.getByRole("button", { name: "Cancelar reporte" }).click();
    await expect(cancelacion.getByText("Elige el motivo de cancelación.")).toBeVisible();
    await cancelacion.getByRole("combobox", { name: /Motivo de cancelación/ }).selectOption("duplicado");
    await cancelacion.getByRole("button", { name: "Cancelar reporte" }).click();
    await expect(cancelacion).toBeHidden();
    await expect(page.locator('[data-reporte="rep-0001"]')).toHaveCount(0);

    await page.goto("/reportes/rep-0001");
    await expect(page.getByRole("region", { name: "Estatus" }).getByText("Cancelado: Duplicado")).toBeVisible();
  });
});
