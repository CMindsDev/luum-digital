import { expect, test } from "./fixtures";
import { sinDesplazamientoHorizontal } from "./helpers";

test("el encabezado y las páginas caben en teléfonos con ambos idiomas", async ({ page }) => {
  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(page.locator("#contenido h1")).toBeVisible();
    for (const idioma of ["yua", "es-MX"]) {
      await page.locator('[data-guia="encabezado.idioma"]').click();
      await expect(page.locator("html")).toHaveAttribute("lang", idioma);
      await sinDesplazamientoHorizontal(page);
      for (const selector of ["encabezado.idioma", "encabezado.identidad"]) {
        const control = page.locator(`[data-guia="${selector}"]`);
        await expect(control).toBeInViewport();
        const area = await control.boundingBox();
        expect(area?.width).toBeGreaterThanOrEqual(44);
        expect(area?.height).toBeGreaterThanOrEqual(44);
      }
      await page.locator('[data-guia="encabezado.identidad"]').click();
      await sinDesplazamientoHorizontal(page);
      await page.keyboard.press("Escape");
    }
    for (const ruta of ["/bienestar", "/servicios", "/legal/politica-cookies"]) {
      await page.goto(ruta);
      await expect(page.locator("#contenido h1")).toBeVisible();
      await sinDesplazamientoHorizontal(page);
    }
  }
});
