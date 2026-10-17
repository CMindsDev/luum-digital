import { expect, test } from "./fixtures";
import { revisarAccesibilidad, sinDesplazamientoHorizontal } from "./helpers";

test.use({ avisoCookiesAtendido: false });

test("acepta el aviso, recuerda la lectura y ofrece cuatro documentos en el footer", async ({ page }) => {
  await page.goto("/");
  const dialogo = page.getByRole("dialog", { name: "Cookies y tu privacidad" });
  await expect(dialogo).toBeVisible();
  await dialogo.getByRole("button", { name: "Aceptar y continuar" }).click();
  await page.reload();
  await expect(page.locator("#contenido h1")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const pie = page.getByRole("contentinfo");
  const links = pie.getByRole("navigation", { name: "Información legal" }).getByRole("link");
  await expect(links).toHaveCount(4);
  await pie.getByRole("link", { name: "Política de Cookies", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Política de Cookies");
  await revisarAccesibilidad(page);
  await sinDesplazamientoHorizontal(page);
});

test("permite aplazar, no obstaculiza Bienestar y devuelve el foco al cerrar el panel", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ahora no", exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem("luum:aviso-cookies:v1"))).toBeNull();
  await page.goto("/bienestar");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Salud y Bienestar");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const abrir = page.getByRole("button", { name: "Revisar aviso de cookies" });
  await abrir.click();
  await expect(page.getByRole("dialog", { name: "Cookies y tu privacidad" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(abrir).toBeFocused();
  await sinDesplazamientoHorizontal(page);
});
