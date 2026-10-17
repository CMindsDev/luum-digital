import { expect, test } from "./fixtures";
import { esperarTitulo, sinDesplazamientoHorizontal } from "./helpers";

declare global {
  interface Window {
    __llamadasGeolocalizacion?: number;
  }
}

/**
 * La ubicación del dispositivo sólo se pide tras tocar «Usar mi ubicación». Si la persona la
 * rechaza, la app lo explica y el reporte se completa con la dirección escrita.
 */
test.describe("Reportes · geolocalización rechazada", () => {
  test.beforeEach(async ({ page }) => {
    // Simula «Bloquear» en el aviso de permisos del navegador y cuenta las solicitudes.
    await page.addInitScript(() => {
      window.__llamadasGeolocalizacion = 0;
      const rechazar: Geolocation["getCurrentPosition"] = (_exito, error) => {
        window.__llamadasGeolocalizacion = (window.__llamadasGeolocalizacion ?? 0) + 1;
        setTimeout(() => error?.({ code: 1, message: "User denied Geolocation", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }), 50);
      };
      Object.defineProperty(navigator, "geolocation", {
        configurable: true,
        value: { getCurrentPosition: rechazar, watchPosition: () => 0, clearWatch: () => undefined },
      });
    });
  });

  test("rechazar el permiso no impide reportar", async ({ page }) => {
    await page.goto("/reportes/nuevo/desazolve_rejilla");
    await expect(await esperarTitulo(page)).toHaveText("Desazolve de rejilla");
    await page.getByRole("textbox", { name: /Describe el problema/ }).fill("La rejilla de la esquina está tapada con hojas y se encharca.");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Confirma la ubicación" })).toBeVisible();

    // Nada pide la ubicación antes del toque explícito.
    expect(await page.evaluate(() => window.__llamadasGeolocalizacion)).toBe(0);
    await page.getByRole("button", { name: "Usar mi ubicación" }).click();
    await expect(page.getByText(/No diste permiso para usar tu ubicación/)).toBeVisible();
    expect(await page.evaluate(() => window.__llamadasGeolocalizacion)).toBe(1);
    await expect(page.getByRole("radio", { name: /Escribir la dirección/ })).toBeChecked();
    await sinDesplazamientoHorizontal(page);

    await page.getByRole("combobox", { name: /Colonia o comisaría/ }).selectOption("san-jose-tzal");
    await page.getByRole("textbox", { name: /^Calle/ }).fill("12");
    await page.getByRole("textbox", { name: /Cruzamiento 1/ }).fill("15");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Agrega una fotografía (opcional)" })).toBeVisible();
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByText("No encontramos reportes iguales abiertos cerca.")).toBeVisible();
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByText(/Escrita a mano \(ubicación aproximada/)).toBeVisible();
    await page.getByRole("button", { name: "Enviar a la simulación" }).click();

    const dialogo = page.getByRole("dialog", { name: "Tu folio de reporte es:" });
    await expect(dialogo.locator("[data-folio]")).toHaveText(/^DEMO-R-\d{7}$/);
  });
});
