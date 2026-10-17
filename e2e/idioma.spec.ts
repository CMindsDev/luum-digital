import { test, expect } from "./fixtures";
import { esperarTitulo, revisarAccesibilidad, sinDesplazamientoHorizontal } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/asistente/estado", (ruta) =>
    ruta.fulfill({
      json: { realtime: { disponible: false }, clef: { disponible: false, modo: "off" }, bienestarIaReal: false },
    }),
  );
});

test("cambia a maya, conserva el idioma al navegar y recargar, y vuelve a español", async ({ page }) => {
  await page.goto("/");
  await esperarTitulo(page);
  const selector = page.locator('[data-guia="encabezado.idioma"]');
  await selector.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("lang", "yua");
  await expect(selector).toHaveText("Español");
  await expect(page.locator('[data-aviso-traduccion]')).toContainText("pendiente de revisión");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Bix a beel");
  const dimensiones = await selector.boundingBox();
  expect(dimensiones?.height).toBeGreaterThanOrEqual(44);
  expect(dimensiones?.width).toBeGreaterThanOrEqual(44);
  await sinDesplazamientoHorizontal(page);
  await revisarAccesibilidad(page);

  await page.goto("/reportes");
  await expect(page.locator("html")).toHaveAttribute("lang", "yua");
  await sinDesplazamientoHorizontal(page);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "yua");
  await selector.click();
  await expect(page.locator("html")).toHaveAttribute("lang", "es-MX");
  await expect(selector).toContainText("Maaya t'aan");
  await expect(page.locator('[data-aviso-traduccion]')).toHaveCount(0);
});

test("la búsqueda envía el idioma maya y mantiene visibles las citas de la fuente", async ({ page }) => {
  await page.route("**/api/asistente/busqueda", (ruta) =>
    ruta.fulfill({
      json: {
        respuesta: "Yaan 14 direcciones [1].",
        generada: true,
        citas: [{
          n: 1,
          titulo: "Portal del Ayuntamiento de Mérida",
          url: "https://merida.gob.mx/municipio/portal/gobierno/dependencias.php",
          fechaConsulta: "2026-10-17",
        }],
        pasajes: [],
        intencion: { categoria: "consulta_tramite", modo: "shadow" },
      },
    }),
  );
  await page.goto("/");
  await esperarTitulo(page);
  await page.locator('[data-guia="encabezado.idioma"]').click();
  await expect(page.locator("html")).toHaveAttribute("lang", "yua");
  const solicitud = page.waitForRequest((request) => request.url().endsWith("/api/asistente/busqueda"));
  await page.goto("/buscar?q=cuantas%20direcciones");
  expect((await solicitud).postDataJSON()).toMatchObject({ idioma: "yua" });
  await expect(page.locator('[data-guia="busqueda.respuesta"]')).toContainText("Yaan 14 direcciones");
  await expect(page.locator('[data-guia="busqueda.fuentes"]')).toContainText("Portal del Ayuntamiento de Mérida");
  await sinDesplazamientoHorizontal(page);
});
