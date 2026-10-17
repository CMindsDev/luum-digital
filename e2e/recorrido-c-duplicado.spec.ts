import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { esperarTitulo, revisarAccesibilidad, sinDesplazamientoHorizontal } from "./helpers";

interface Conteos {
  reportes: number;
  movimientos: number;
  aportacionesBache: number;
}

/** Lee los datos ficticios persistidos por los adaptadores demo (prefijo merida-demo:v1:). */
async function leerConteos(page: Page): Promise<Conteos> {
  return page.evaluate(() => {
    const leer = (nombre: string): unknown => JSON.parse(window.localStorage.getItem(`merida-demo:v1:datos:${nombre}`) ?? "[]");
    const reportes = leer("reportes") as { id: string; aportaciones: unknown[] }[];
    const movimientos = leer("movimientos") as unknown[];
    return {
      reportes: reportes.length,
      movimientos: movimientos.length,
      aportacionesBache: reportes.find((r) => r.id === "rep-0001")?.aportaciones.length ?? -1,
    };
  });
}

/**
 * Recorrido C: Ana reporta un bache en Centro, calle 60 x 59 y 61. El bache semilla de Bruno
 * (DEMO-R-0000001) aparece como posible duplicado; Ana aporta información: no se crea un reporte
 * nuevo ni se generan puntos.
 */
test.describe("Recorrido C · posible duplicado", () => {
  test("aportar información al bache de Bruno no crea reporte ni puntos", async ({ page }) => {
    await page.goto("/reportes");
    await esperarTitulo(page);
    // El hub consulta «Mis reportes»: con eso ya se sembraron los datos de demostración.
    await expect(page.getByText(/Tienes \d+ reportes? de demostración/)).toBeVisible();
    const antes = await leerConteos(page);
    expect(antes.reportes).toBeGreaterThan(0);
    expect(antes.aportacionesBache).toBe(0);

    await page.locator('[data-guia="reportes.bache"]').click();
    await expect(await esperarTitulo(page)).toHaveText("Bache a la vista");

    await page.getByRole("textbox", { name: /Describe el problema/ }).fill("Sigue el bache en el carril derecho de la calle 60, frente al parque.");
    await page.getByRole("button", { name: "Continuar" }).click();

    await page.getByRole("combobox", { name: /Colonia o comisaría/ }).selectOption("centro");
    await page.getByRole("textbox", { name: /^Calle/ }).fill("60");
    await page.getByRole("textbox", { name: /Cruzamiento 1/ }).fill("59");
    await page.getByRole("textbox", { name: /Cruzamiento 2/ }).fill("61");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Agrega una fotografía (opcional)" })).toBeVisible();
    await page.getByRole("button", { name: "Continuar" }).click();

    await test.step("aparece el bache semilla de Bruno como posible duplicado", async () => {
      await expect(page.getByRole("heading", { level: 2, name: "Revisa si ya lo reportaron" })).toBeVisible();
      await expect(page.getByText(/podría ser el mismo incidente/)).toBeVisible();
      await expect(page.getByText("DEMO-R-0000001")).toBeVisible();
      await expect(page.getByText(/misma calle y colonia/)).toBeVisible();
      await expect(page.getByRole("button", { name: "Es otro incidente: continuar" })).toBeVisible();
      await sinDesplazamientoHorizontal(page);
      await revisarAccesibilidad(page);
    });

    await test.step("es el mismo incidente: aportar información", async () => {
      await page.getByRole("button", { name: "Es el mismo incidente: aportar información al reporte DEMO-R-0000001" }).click();
      await expect(page.getByRole("heading", { name: "Aportar información al reporte DEMO-R-0000001" })).toBeFocused();
      await expect(page.getByText(/No se crea un reporte nuevo y las aportaciones no generan puntos/)).toBeVisible();
      await page.getByRole("button", { name: "Enviar aportación" }).click();
      await expect(page.getByRole("heading", { name: "Aportaste información al reporte DEMO-R-0000001" })).toBeVisible();
      await expect(page.getByRole("dialog", { name: "Tu folio de reporte es:" })).toHaveCount(0);
    });

    await test.step("no se creó un reporte nuevo ni se generaron puntos", async () => {
      const despues = await leerConteos(page);
      expect(despues.reportes).toBe(antes.reportes);
      expect(despues.movimientos).toBe(antes.movimientos);
      expect(despues.aportacionesBache).toBe(1);
    });

    await test.step("la aportación se ve en el detalle del reporte de Bruno", async () => {
      await page.getByRole("link", { name: "Ver el reporte" }).click();
      await expect(page).toHaveURL(/\/reportes\/rep-0001$/);
      await expect(await esperarTitulo(page)).toHaveText("Bache");
      const aportaciones = page.getByRole("region", { name: "Aportaciones" });
      await expect(aportaciones.getByText("Sigue el bache en el carril derecho de la calle 60, frente al parque.")).toBeVisible();
      await expect(aportaciones.getByText(/^Tú ·/)).toBeVisible();
      await expect(page.getByText("Registrado", { exact: true }).first()).toBeVisible();
      await sinDesplazamientoHorizontal(page);
      await revisarAccesibilidad(page);
    });
  });
});
