import { expect, test } from "./fixtures";
import { esperarTitulo, navegarA, revisarAccesibilidad, sinDesplazamientoHorizontal } from "./helpers";

/** Notificaciones simuladas: lista, marcar leídas, abrir el enlace interno y filtro «Sin leer». */
test.describe("Notificaciones", () => {
  test("marcar leídas, abrir una gestión y vaciar «Sin leer»", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    await navegarA(page, "notificaciones");
    const lista = page.getByRole("list", { name: "Notificaciones" });
    await expect(lista.getByRole("article")).toHaveCount(4);
    await expect(page.getByText("2 avisos sin leer.")).toBeVisible();
    await sinDesplazamientoHorizontal(page);
    await revisarAccesibilidad(page);

    await lista.getByRole("button", { name: /^Marcar como leída/ }).first().click();
    await expect(page.getByText("1 aviso sin leer.")).toBeVisible();

    // Abrir lleva a la vista interna relacionada.
    const deGestion = lista.getByRole("article").filter({ hasText: "DEMO-G-0000001" });
    await deGestion.getByRole("link", { name: /^Abrir/ }).click();
    await expect(page).toHaveURL(/\/gestiones\/ges-0001$/);
    await expect(page.locator("#contenido h1")).toHaveText("Copia Simple de Cédula Catastral Vigente");

    await navegarA(page, "notificaciones");
    await page.getByRole("button", { name: /Marcar todas/ }).click();
    await expect(page.getByText("No tienes avisos sin leer.")).toBeVisible();
    await page.getByRole("radio", { name: /Sin leer/ }).click();
    await expect(page.getByRole("heading", { name: "No tienes notificaciones sin leer" })).toBeVisible();
    await sinDesplazamientoHorizontal(page);
  });

  test("cada identidad ve sólo sus notificaciones", async ({ page }) => {
    await page.goto("/notificaciones");
    await esperarTitulo(page);
    await expect(page.getByRole("heading", { name: /Tu reporte DEMO-R-0000005 fue registrado/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Hay un reporte cerca que puedes verificar" })).toHaveCount(0);
  });
});
