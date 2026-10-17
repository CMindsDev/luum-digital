import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { cambiarIdentidad, esperarTitulo, navegarA, revisarAccesibilidad, sinDesplazamientoHorizontal } from "./helpers";

/** PNG de 1×1 píxel para probar la foto de evidencia (nunca se guarda). */
const PNG_MINIMO = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

/** Despliega «Mostrar todos» hasta que el elemento exista (la lista está paginada). */
async function revelar(page: Page, selector: string) {
  const objetivo = page.locator(selector);
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
 * Recorrido E: como Bruno, verificar el reporte «Solucionado» de Ana; como operador, aprobar y
 * acreditar los puntos una sola vez (repetir la aprobación no duplica). El voto ciudadano no cambia
 * el estado municipal.
 */
test.describe("Recorrido E · Verificación ciudadana", () => {
  test("Bruno verifica el reporte de Ana y el operador acredita los puntos una sola vez", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    await cambiarIdentidad(page, "Bruno Canul");
    await navegarA(page, "participacion");

    await test.step("resumen: pendientes y aprobados por separado", async () => {
      await expect(page.getByRole("heading", { name: "Reportes que puedes verificar" })).toBeVisible();
      await expect(page.locator('[data-saldo="disponible"]')).toHaveText("40");
      await expect(page.locator('[data-saldo="pendientes"]')).toHaveText("70");
      await expect(page.getByText("Tus propios reportes no aparecen aquí.")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Mis verificaciones" })).toBeVisible();
      await sinDesplazamientoHorizontal(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      await revisarAccesibilidad(page);
    });

    await test.step("sólo aparecen reportes ajenos con atención reportada", async () => {
      await page.getByRole("button", { name: /^Mostrar todos/ }).click();
      // rep-0001 y rep-0003 son de Bruno; rep-0002 es de Ana.
      await expect(page.locator('[data-reporte="rep-0001"]')).toHaveCount(0);
      await expect(page.locator('[data-reporte="rep-0003"]')).toHaveCount(0);
      await expect(page.locator('[data-reporte="rep-0002"]')).toBeVisible();
    });

    await (await revelar(page, '[data-guia="participacion.verificar_rep-0002"]')).click();
    await expect(page).toHaveURL(/\/participacion\/verificar\/rep-0002$/);
    await expect(await esperarTitulo(page)).toHaveText("Verificar reparación");

    await test.step("tres opciones, regla de calidad y validación del formulario", async () => {
      await expect(page.getByRole("radio", { name: /La reparación parece completada/ })).toHaveCount(1);
      await expect(page.getByRole("radio", { name: /El problema persiste/ })).toHaveCount(1);
      await expect(page.getByRole("radio", { name: /No puedo comprobarlo/ })).toHaveCount(1);
      await expect(page.getByText("Se premia la calidad, no la respuesta positiva.")).toBeVisible();
      await expect(page.getByText(/Decir que el problema persiste vale lo mismo/)).toBeVisible();
      await sinDesplazamientoHorizontal(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      await revisarAccesibilidad(page);
      await page.getByRole("button", { name: "Enviar verificación" }).click();
      await expect(page.getByText("Elige lo que observaste.")).toBeVisible();
      await expect(page.getByRole("radio", { name: /La reparación parece completada/ })).toBeFocused();
      await page.evaluate(() => window.scrollTo(0, 0));
      await revisarAccesibilidad(page);
    });

    await test.step("completar con comentario, punto confirmado y foto opcional", async () => {
      await page.locator('[data-guia="participacion.resultado_problema_persiste"]').click();
      await page.getByRole("textbox", { name: /Comentario/ }).fill("La luminaria sigue sin encender de noche; fui a la esquina.");
      await page.getByRole("checkbox", { name: /Confirmo que observé el punto exacto/ }).check();
      await page.locator('[data-guia="participacion.foto"]').setInputFiles({ name: "evidencia.png", mimeType: "image/png", buffer: PNG_MINIMO });
      await expect(page.getByAltText("Vista previa de la foto de evidencia")).toBeVisible();
      await expect(page.getByText(/vista previa temporal, no se guarda/)).toBeVisible();
      await expect(page.locator('[data-guia="participacion.calidad"]')).toContainText("3 de 3 criterios");
      await expect(page.locator('[data-guia="participacion.calidad"]')).toContainText("30 puntos");
      await page.getByRole("button", { name: "Enviar verificación" }).click();
    });

    await test.step("queda pendiente de revisión y no cambia el estado municipal", async () => {
      await expect(page.getByRole("heading", { level: 2, name: "Verificación enviada" })).toBeFocused();
      await expect(page.getByText(/pendiente de revisión/).first()).toBeVisible();
      await expect(page.getByText(/30 puntos pendientes/)).toBeVisible();
      await expect(page.getByText(/el estado municipal del reporte no cambia/)).toBeVisible();
      await page.getByRole("link", { name: "Ir a Participación" }).click();
      await expect(page.locator('[data-saldo="disponible"]')).toHaveText("40");
      await expect(page.locator('[data-saldo="pendientes"]')).toHaveText("100");
      await expect(page.locator('[data-reporte="rep-0002"]')).toHaveCount(0);
      const mia = page.locator('[data-verificacion-id]').filter({ hasText: "DEMO-R-0000002" });
      await expect(mia).toContainText("Pendiente de revisión");
      await expect(mia).toContainText("El problema persiste");
    });

    await cambiarIdentidad(page, "Carmen Dzib");
    await navegarA(page, "operador");
    await page.getByRole("tab", { name: /^Verificaciones/ }).click();

    await test.step("el operador aprueba y acredita una sola vez", async () => {
      const tarjeta = page.locator('[data-folio="DEMO-R-0000002"][data-verificacion-id]');
      await expect(tarjeta).toContainText("+30 pendientes");
      await tarjeta.getByRole("button", { name: "Aprobar la verificación de DEMO-R-0000002" }).click();
      const dialogo = page.getByRole("dialog", { name: "¿Aprobar la verificación de DEMO-R-0000002?" });
      await expect(dialogo).toContainText("una sola vez");
      await dialogo.getByRole("button", { name: "Aprobar y acreditar" }).click();
      await expect(dialogo).toBeHidden();

      await page.getByRole("radio", { name: /^Revisadas/ }).click();
      const aprobada = page.locator('[data-folio="DEMO-R-0000002"][data-verificacion-id]');
      await expect(aprobada).toContainText("Aprobada");
      await expect(aprobada).toContainText("+30 acreditados una sola vez");
      await expect(aprobada).toContainText("verificacion:");

      // Repetir la aprobación no duplica los puntos.
      await aprobada.getByRole("button", { name: "Repetir aprobación de DEMO-R-0000002" }).click();
      await expect(page.getByText("Ya estaba aprobada")).toBeVisible();
      await expect(aprobada).toContainText("+30 acreditados una sola vez");
    });

    await cambiarIdentidad(page, "Bruno Canul");
    await navegarA(page, "participacion");

    await test.step("Bruno ve los puntos acreditados una sola vez", async () => {
      await expect(page.locator('[data-saldo="disponible"]')).toHaveText("70");
      await expect(page.locator('[data-saldo="pendientes"]')).toHaveText("70");
      await page.getByRole("link", { name: "Ver recompensas" }).click();
      await expect(await esperarTitulo(page)).toHaveText("Recompensas");
      const movimientos = page.locator('[data-movimiento="verificacion_aprobada"]').filter({ hasText: "DEMO-R-0000002" });
      await expect(movimientos).toHaveCount(1);
      await expect(movimientos).toContainText("Aprobado");
      await expect(movimientos).toContainText("+30");
    });

    await test.step("el estado municipal no cambió: la verificación es otro eje", async () => {
      await page.goto("/reportes/rep-0002");
      await esperarTitulo(page);
      const estatus = page.getByRole("region", { name: "Estatus" });
      await expect(estatus.getByText("Solucionado", { exact: true })).toBeVisible();
      await expect(estatus.getByText("Discrepancia")).toBeVisible();
      await expect(page.getByText(/Un voto ciudadano nunca cierra ni reabre el reporte/)).toBeVisible();
    });
  });
});
