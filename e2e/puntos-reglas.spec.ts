import { expect, test } from "./fixtures";
import { cambiarIdentidad, esperarTitulo, navegarA, revisarAccesibilidad, sinDesplazamientoHorizontal } from "./helpers";

/**
 * Reglas de puntos de demostración (AGENTS.md §2.8): se premia la calidad y no la respuesta
 * positiva, nadie gana por verificarse a sí mismo, toda reversión o rechazo lleva motivo y los
 * puntos y la popularidad nunca deciden la prioridad.
 */
test.describe("Reglas de puntos", () => {
  test("las reglas son visibles, configurables y explican que la prioridad no depende de puntos", async ({ page }) => {
    await page.goto("/participacion/reglas");
    await expect(await esperarTitulo(page)).toHaveText("Reglas de puntos");
    await expect(page.getByText("Reglas de demostración").first()).toBeVisible();
    await expect(page.getByText(/src\/data\/reglas-puntos\.ts/)).toBeVisible();
    await expect(page.getByText("Reporte validado: 40 puntos.", { exact: false })).toBeVisible();

    const prioridad = page.getByRole("region", { name: "Los puntos y la popularidad no deciden la prioridad" });
    await expect(prioridad).toBeVisible();
    await expect(prioridad).toContainText("No depende de cuántas personas reportan ni de puntos");
    await expect(prioridad.getByRole("heading", { name: "Criterios que nunca se usan" })).toBeVisible();
    await expect(prioridad).toContainText("Popularidad o insistencia");

    // La calculadora usa la misma función que el adaptador: completada y persiste valen igual.
    const calculadora = page.getByRole("region", { name: "Prueba la regla de verificación" });
    await calculadora.locator("label", { hasText: "El problema persiste" }).click();
    await expect(calculadora.getByRole("status")).toContainText("25 puntos");
    await calculadora.locator("label", { hasText: "La reparación parece completada" }).click();
    await expect(calculadora.getByRole("status")).toContainText("25 puntos");
    await calculadora.locator("label", { hasText: "No pude comprobarlo" }).click();
    await expect(calculadora.getByRole("status")).toContainText("10 puntos");

    await sinDesplazamientoHorizontal(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await revisarAccesibilidad(page);
  });

  test("nadie verifica su propio reporte, uno que no está solucionado ni dos veces el mismo", async ({ page }) => {
    // Ana (identidad inicial) hizo rep-0002: no puede verificarlo.
    await page.goto("/participacion/verificar/rep-0002");
    await esperarTitulo(page);
    await expect(page.getByRole("heading", { name: "No puedes verificar tu propio reporte" })).toBeVisible();
    await expect(page.getByText("No puedes verificar un reporte que tú hiciste.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Enviar verificación" })).toHaveCount(0);

    // rep-0001 todavía está «Registrado»: no hay atención que verificar.
    await page.goto("/participacion/verificar/rep-0001");
    await esperarTitulo(page);
    await expect(page.getByRole("heading", { name: "Este reporte aún no se puede verificar" })).toBeVisible();

    // Ana ya verificó rep-0003 (verificación aprobada de la semilla).
    await page.goto("/participacion/verificar/rep-0003");
    await esperarTitulo(page);
    await expect(page.getByRole("heading", { name: "Ya verificaste este reporte" })).toBeVisible();
    await sinDesplazamientoHorizontal(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await revisarAccesibilidad(page);

    // La lista de «puedes verificar» de Ana nunca incluye sus propios reportes ni los ya verificados.
    await page.goto("/participacion");
    await esperarTitulo(page);
    await page.locator("[data-reporte]").first().waitFor();
    await page.getByRole("button", { name: /^Mostrar todos/ }).click();
    for (const id of ["rep-0002", "rep-0004", "rep-0005", "rep-0003"]) await expect(page.locator(`[data-reporte="${id}"]`)).toHaveCount(0);
  });

  test("el operador aprueba y revierte con motivo: el historial lo conserva", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    await cambiarIdentidad(page, "Carmen Dzib");
    await navegarA(page, "operador");
    await page.getByRole("tab", { name: /^Verificaciones/ }).click();

    await page.locator('[data-guia="operador.aprobar_ver-0002"]').click();
    await page.getByRole("dialog", { name: "¿Aprobar la verificación de DEMO-R-0000006?" }).getByRole("button", { name: "Aprobar y acreditar" }).click();
    await page.getByRole("radio", { name: /^Revisadas/ }).click();

    await page.locator('[data-guia="operador.revertir_ver-0002"]').click();
    const dialogo = page.getByRole("dialog", { name: "Revertir la validación de DEMO-R-0000006" });
    await expect(dialogo).toContainText("Revertir dos veces no descuenta dos veces");
    // Sin motivo no se puede revertir.
    await dialogo.getByRole("button", { name: "Revertir validación" }).click();
    await expect(dialogo.getByText("Escribe el motivo (al menos 5 caracteres).")).toBeVisible();
    await expect(dialogo.getByRole("textbox", { name: /Motivo de la reversión/ })).toBeFocused();
    await dialogo.getByRole("textbox", { name: /Motivo de la reversión/ }).fill("Foto de otro lugar (demostración)");
    await dialogo.getByRole("button", { name: "Revertir validación" }).click();
    await expect(dialogo).toBeHidden();

    const tarjeta = page.locator('[data-verificacion-id="ver-0002"]');
    await expect(tarjeta).toContainText("Validación revertida");
    await expect(tarjeta).toContainText("Motivo registrado: Foto de otro lugar (demostración)");
    await expect(tarjeta).toContainText("−30 revertidos con motivo");
    await expect(tarjeta.getByRole("button", { name: /Repetir aprobación|Revertir/ })).toHaveCount(0);

    // Bruno conserva el crédito y la reversión con su motivo; el saldo vuelve al inicial.
    await cambiarIdentidad(page, "Bruno Canul");
    await page.goto("/participacion/recompensas");
    await esperarTitulo(page);
    await expect(page.locator('[data-saldo="disponible"]')).toHaveText("40");
    await expect(page.locator('[data-saldo="pendientes"]')).toHaveText("40");
    const reversion = page.locator('[data-movimiento="reversion"]');
    await expect(reversion).toHaveCount(1);
    await expect(reversion).toContainText("Validación revertida: Foto de otro lugar (demostración)");
    await expect(reversion).toContainText("−30");
    await expect(page.locator('[data-movimiento="verificacion_aprobada"]').filter({ hasText: "DEMO-R-0000006" })).toContainText("+30");
  });

  test("rechazar una verificación exige motivo y sus puntos no suman", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    await cambiarIdentidad(page, "Carmen Dzib");
    await navegarA(page, "operador");
    await page.getByRole("tab", { name: /^Verificaciones/ }).click();

    await page.locator('[data-guia="operador.rechazar_ver-0002"]').click();
    const dialogo = page.getByRole("dialog", { name: "Rechazar la verificación de DEMO-R-0000006" });
    await dialogo.getByRole("button", { name: "Rechazar verificación" }).click();
    await expect(dialogo.getByText("Escribe el motivo (al menos 5 caracteres).")).toBeVisible();
    await dialogo.getByRole("textbox", { name: /Motivo del rechazo/ }).fill("No coincide con el lugar del reporte");
    await dialogo.getByRole("button", { name: "Rechazar verificación" }).click();
    await expect(dialogo).toBeHidden();

    await page.getByRole("radio", { name: /^Revisadas/ }).click();
    const tarjeta = page.locator('[data-verificacion-id="ver-0002"]');
    await expect(tarjeta).toContainText("No aprobada");
    await expect(tarjeta).toContainText("cancelados: no suman");

    await cambiarIdentidad(page, "Bruno Canul");
    await page.goto("/participacion/recompensas");
    await esperarTitulo(page);
    await expect(page.locator('[data-saldo="disponible"]')).toHaveText("40");
    await expect(page.locator('[data-saldo="pendientes"]')).toHaveText("40");
    await expect(page.locator('[data-movimiento="verificacion_aprobada"]').filter({ hasText: "DEMO-R-0000006" })).toContainText("Cancelado");
  });
});
