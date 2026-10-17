import { expect, test } from "./fixtures";
import {
  cambiarIdentidad,
  esperarTitulo,
  navegarA,
  revisarAccesibilidad,
  SECCIONES_E2E,
  sinDesplazamientoHorizontal,
  TEXTO_ROTULO_DEMO,
  type SeccionE2E,
} from "./helpers";

const SECCIONES_CIUDADANIA: SeccionE2E[] = [
  "servicios",
  "reportes",
  "mapa",
  "bienestar",
  "participacion",
  "expediente",
  "gestiones",
  "notificaciones",
  "cuenta",
  "inicio",
];

test.describe("AppShell", () => {
  test("recorre todas las secciones con la navegación real", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    const rotulo = page.getByRole("link", { name: new RegExp(TEXTO_ROTULO_DEMO) });

    for (const seccion of SECCIONES_CIUDADANIA) {
      await test.step(SECCIONES_E2E[seccion].etiqueta, async () => {
        const h1 = await navegarA(page, seccion);
        await expect(rotulo).toBeVisible();
        await expect(h1).toBeFocused();
        await expect(page.locator("#contenido h1")).toHaveCount(1);
        await sinDesplazamientoHorizontal(page);
      });
    }

    // La sección de operación sólo aparece para el rol operador/administración.
    await expect(page.getByRole("link", { name: "Operador de demostración" })).toHaveCount(0);
    await cambiarIdentidad(page, "Carmen Dzib");
    await test.step("Operador de demostración", async () => {
      await navegarA(page, "operador");
      await expect(rotulo).toBeVisible();
      await sinDesplazamientoHorizontal(page);
    });
  });

  test("inicio sin violaciones de accesibilidad graves", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    await expect(page.getByRole("link", { name: new RegExp(TEXTO_ROTULO_DEMO) })).toBeVisible();
    await sinDesplazamientoHorizontal(page);
    await revisarAccesibilidad(page);
  });

  test("el rótulo de demostración lleva a las limitaciones del prototipo", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    await page.getByRole("link", { name: new RegExp(TEXTO_ROTULO_DEMO) }).click();
    await expect(page).toHaveURL(/\/cuenta#acerca$/);
    await expect(page.getByRole("heading", { name: "Acerca de este prototipo" })).toBeVisible();
    await expect(page.locator("#acerca")).toBeFocused();
  });

  test("saltar al contenido mueve el foco al principal", async ({ page }) => {
    await page.goto("/servicios");
    await esperarTitulo(page);
    await page.keyboard.press("Tab");
    const saltar = page.getByRole("link", { name: "Saltar al contenido" });
    await expect(saltar).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#contenido")).toBeFocused();
  });

  test("una ruta inexistente muestra un 404 útil dentro del AppShell", async ({ page }) => {
    await page.goto("/ruta-que-no-existe");
    const h1 = await esperarTitulo(page);
    await expect(h1).toHaveText("No encontramos esta página");
    await expect(page.getByRole("link", { name: "Ir al inicio" })).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(TEXTO_ROTULO_DEMO) })).toBeVisible();
  });

  test("la navegación muestra la sección activa", async ({ page }) => {
    await page.goto("/reportes");
    await esperarTitulo(page);
    const principal = page.getByRole("navigation", { name: "Principal" });
    await expect(principal.getByRole("link", { name: "Reportes", exact: true })).toHaveAttribute("aria-current", "page");
  });
});
