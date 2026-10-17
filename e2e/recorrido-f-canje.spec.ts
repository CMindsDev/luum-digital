import { expect, test } from "./fixtures";
import { esperarTitulo, navegarA, revisarAccesibilidad, sinDesplazamientoHorizontal } from "./helpers";

/**
 * Recorrido F: canjear un beneficio FICTICIO con la identidad inicial (Ana: 105 puntos aprobados y
 * 40 pendientes), ver el saldo actualizado y comprobar que nunca queda saldo negativo.
 */
test.describe("Recorrido F · Canje de beneficio de ejemplo", () => {
  test("canjea la insignia de ejemplo y el saldo se actualiza sin quedar negativo", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    await navegarA(page, "participacion");
    await page.getByRole("link", { name: "Ver recompensas" }).click();
    await expect(page).toHaveURL(/\/participacion\/recompensas$/);
    await expect(await esperarTitulo(page)).toHaveText("Recompensas");

    await test.step("saldo disponible y pendiente por separado; beneficios marcados como ejemplo", async () => {
      await expect(page.locator('[data-saldo="disponible"]')).toHaveText("105");
      await expect(page.locator('[data-saldo="pendientes"]')).toHaveText("40");
      await expect(page.locator('[data-saldo="canjeados"]')).toHaveText("0");
      await expect(page.getByText(/no hay comercios, patrocinios ni descuentos municipales, fiscales o comerciales/)).toBeVisible();
      const beneficios = page.getByRole("list", { name: "Beneficios de ejemplo" }).getByRole("article");
      await expect(beneficios).toHaveCount(5);
      for (const beneficio of await beneficios.all()) await expect(beneficio.getByText("Ejemplo", { exact: true })).toBeVisible();
      await sinDesplazamientoHorizontal(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      await revisarAccesibilidad(page);
    });

    await test.step("saldo insuficiente y beneficio agotado quedan bloqueados", async () => {
      await expect(page.locator('[data-guia="recompensas.canjear_fondo-pantalla"]')).toBeDisabled();
      await expect(page.locator('[data-beneficio="fondo-pantalla"]')).toContainText("Te faltan 45 puntos aprobados.");
      await expect(page.locator('[data-guia="recompensas.canjear_taller-huerto"]')).toBeDisabled();
      await expect(page.locator('[data-guia="recompensas.canjear_kit-calle"]')).toBeDisabled();
      await expect(page.locator('[data-beneficio="kit-calle"]')).toContainText("Agotado");
      await expect(page.locator('[data-guia="recompensas.canjear_insignia-vecindad"]')).toBeEnabled();
    });

    await test.step("confirmar el canje simulado (un doble clic no duplica el canje)", async () => {
      await page.locator('[data-guia="recompensas.canjear_insignia-vecindad"]').click();
      const confirmacion = page.getByRole("dialog", { name: "¿Canjear este beneficio de ejemplo?" });
      await expect(confirmacion).toBeVisible();
      await expect(confirmacion).toContainText("DEMO-B sin validez");
      await expect(confirmacion).toContainText("Saldo después del canje");
      await expect(confirmacion).toContainText("5 puntos");
      await confirmacion.getByRole("button", { name: "Confirmar canje simulado" }).dblclick();
      const resultado = page.getByRole("dialog", { name: "Canje simulado registrado" });
      await expect(resultado).toBeVisible();
      await expect(resultado.locator("[data-codigo-canje]")).toHaveText(/DEMO-B-\d{7}/);
      await expect(resultado.getByText("Sin validez")).toBeVisible();
      await resultado.getByRole("button", { name: "Entendido" }).click();
      await expect(resultado).toBeHidden();
    });

    await test.step("saldo actualizado, historial con motivo y un solo canje", async () => {
      await expect(page.locator('[data-saldo="disponible"]')).toHaveText("5");
      await expect(page.locator('[data-saldo="pendientes"]')).toHaveText("40");
      await expect(page.locator('[data-saldo="canjeados"]')).toHaveText("100");
      const canje = page.locator('[data-movimiento="canje"]');
      await expect(canje).toHaveCount(1);
      await expect(canje).toContainText("Canje de ejemplo: Insignia «Vecindad atenta» (ejemplo)");
      await expect(canje).toContainText("−100");
      await expect(page.getByRole("list", { name: "Canjes de ejemplo" }).getByRole("listitem")).toHaveCount(1);
      await expect(page.getByRole("list", { name: "Canjes de ejemplo" })).toContainText(/DEMO-B-\d{7}/);
    });

    await test.step("sin saldo negativo: ya no alcanza para ningún beneficio", async () => {
      await expect(page.locator('[data-guia="recompensas.canjear_insignia-vecindad"]')).toBeDisabled();
      await expect(page.locator('[data-beneficio="insignia-vecindad"]')).toContainText("Te faltan 95 puntos aprobados.");
      const disponible = Number(await page.locator('[data-saldo="disponible"]').innerText());
      expect(disponible).toBeGreaterThanOrEqual(0);
      await sinDesplazamientoHorizontal(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      await revisarAccesibilidad(page);
    });
  });

  test("el saldo se conserva al volver a Participación", async ({ page }) => {
    await page.goto("/participacion/recompensas");
    await esperarTitulo(page);
    await page.locator('[data-guia="recompensas.canjear_insignia-vecindad"]').click();
    await page.getByRole("dialog", { name: "¿Canjear este beneficio de ejemplo?" }).getByRole("button", { name: "Confirmar canje simulado" }).click();
    await page.getByRole("dialog", { name: "Canje simulado registrado" }).getByRole("button", { name: "Entendido" }).click();
    await page.getByRole("link", { name: "Regresar" }).click();
    await expect(page).toHaveURL(/\/participacion$/);
    await expect(page.locator('[data-saldo="disponible"]')).toHaveText("5");
    await expect(page.locator('[data-saldo="canjeados"]')).toHaveText("100");
  });
});
