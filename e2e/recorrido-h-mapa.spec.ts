import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { cambiarIdentidad, esperarTitulo, navegarA, revisarAccesibilidad, sinDesplazamientoHorizontal } from "./helpers";

/**
 * Recorrido H: Mapa / Visor Urbano.
 * - En pruebas (navigator.webdriver) el mapa no pide estilos ni teselas a terceros: dibuja un fondo
 *   liso con las capas propias («Mapa base omitido…»), así no hay red externa ni errores de consola.
 * - El respaldo se prueba con un navegador sin WebGL: el mapa no puede iniciar y la lista sigue.
 */

/** Con menos de 1024 px los filtros viven en una hoja; en escritorio, en la columna lateral. */
function filtrosEnHoja(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1280) < 1024;
}

async function elegirFiltro(page: Page, grupo: "Tipo de reporte" | "Estado municipal", opcion: RegExp) {
  if (filtrosEnHoja(page)) {
    const hoja = page.getByRole("dialog", { name: "Filtrar incidencias" });
    if (!(await hoja.isVisible())) {
      await page.getByRole("button", { name: /^Filtros/ }).click();
      await expect(hoja).toBeVisible();
    }
    const chip = hoja.getByRole("group", { name: grupo }).getByRole("button", { name: opcion });
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    return;
  }
  const chip = page.getByRole("group", { name: grupo }).getByRole("button", { name: opcion });
  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "true");
}

async function cerrarHojaDeFiltros(page: Page) {
  if (!filtrosEnHoja(page)) return;
  const hoja = page.getByRole("dialog", { name: "Filtrar incidencias" });
  await hoja.getByRole("button", { name: /^Ver \d+ incidencias/ }).click();
  await expect(hoja).toBeHidden();
}

async function esperarMapaListo(page: Page) {
  await expect(page.locator('[data-guia="mapa.mapa"]')).toHaveAttribute("data-estado-mapa", "listo", { timeout: 20_000 });
}

const filtrosAplicados = (page: Page) => page.getByRole("list", { name: "Filtros aplicados" });

test.describe("Recorrido H · Mapa / Visor Urbano", () => {
  test("abre el Visor, filtra incidencias, abre un detalle y regresa con el filtro intacto", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    const h1 = await navegarA(page, "mapa");
    await expect(h1).toHaveText("Mapa / Visor Urbano");
    await esperarMapaListo(page);
    await expect(page.getByText("Mapa base omitido: pruebas automatizadas sin red externa")).toBeVisible();
    await expect(page.getByText("60 incidencias de demostración", { exact: true })).toBeVisible();

    await elegirFiltro(page, "Tipo de reporte", /^Bache/);
    await elegirFiltro(page, "Estado municipal", /^Registrado/);
    await cerrarHojaDeFiltros(page);
    await expect(page).toHaveURL(/\/mapa\?categoria=bache&estado=registrado$/);
    await expect(page.getByText(/^\d+ de 60 incidencias de demostración con estos filtros$/)).toBeVisible();
    await expect(filtrosAplicados(page).getByText("Bache", { exact: true })).toBeVisible();
    await expect(filtrosAplicados(page).getByText("Registrado", { exact: true })).toBeVisible();
    await sinDesplazamientoHorizontal(page);

    // La vista Lista es la alternativa accesible al mapa y conserva los filtros.
    await page.getByRole("radiogroup", { name: "Vista del visor" }).getByRole("radio", { name: "Lista" }).click();
    await expect(page).toHaveURL(/vista=lista/);
    const lista = page.getByRole("list", { name: "Incidencias" });
    const tarjetas = lista.getByRole("listitem");
    await expect(tarjetas.first()).toBeVisible();
    const total = await tarjetas.count();
    for (let i = 0; i < total; i += 1) {
      await expect(tarjetas.nth(i).getByRole("heading")).toContainText("Bache");
      await expect(tarjetas.nth(i).getByText("Registrado", { exact: true })).toBeVisible();
    }

    await tarjetas.first().getByRole("link").click();
    await expect(page).toHaveURL(/\/reportes\/rep-\d+$/);
    await esperarTitulo(page);

    await page.goBack();
    await expect(page).toHaveURL(/\/mapa\?vista=lista&categoria=bache&estado=registrado$/);
    await expect(page.getByRole("radiogroup", { name: "Vista del visor" }).getByRole("radio", { name: "Lista" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(filtrosAplicados(page).getByText("Bache", { exact: true })).toBeVisible();
    await expect(filtrosAplicados(page).getByText("Registrado", { exact: true })).toBeVisible();
    await expect(page.getByRole("list", { name: "Incidencias" }).getByRole("listitem")).toHaveCount(total);
    await sinDesplazamientoHorizontal(page);
  });

  test("una incidencia abierta en el panel del mapa enlaza a su detalle y al volver no reabre el panel", async ({ page }) => {
    // Así abre el asistente una incidencia concreta (acción abrirMapa con reporteId).
    await page.goto("/mapa?categoria=bache&reporte=rep-0001");
    await esperarTitulo(page);
    const panel = page.getByRole("dialog", { name: "Incidencia en el mapa" });
    await expect(panel).toBeVisible();
    await expect(panel.getByText("DEMO-R-0000001")).toBeVisible();
    await expect(panel.getByText("Incidencia de demostración")).toBeVisible();

    await panel.getByRole("link", { name: "Ver detalle del reporte" }).click();
    await expect(page).toHaveURL(/\/reportes\/rep-0001$/);
    await esperarTitulo(page);

    await page.goBack();
    await expect(page).toHaveURL(/\/mapa\?categoria=bache$/);
    await expect(page.getByRole("dialog", { name: "Incidencia en el mapa" })).toBeHidden();
    await expect(filtrosAplicados(page).getByText("Bache", { exact: true })).toBeVisible();
  });

  test("si el mapa no puede iniciar, el aviso es claro y la lista y los filtros siguen funcionando", async ({ page }) => {
    // Navegador sin WebGL: el motor del mapa no puede crear su lienzo.
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
        configurable: true,
        value: function (this: HTMLCanvasElement, tipo: string, ...resto: unknown[]) {
          if (/webgl/i.test(tipo)) return null;
          return Reflect.apply(original, this, [tipo, ...resto]);
        },
      });
    });
    await page.goto("/mapa");
    await esperarTitulo(page);

    const aviso = page.getByRole("alert").filter({ hasText: "No pudimos cargar el mapa." });
    await expect(aviso).toBeVisible({ timeout: 20_000 });
    await expect(aviso).toContainText("La lista de incidencias, los filtros y los formularios siguen funcionando");
    await expect(aviso.getByRole("button", { name: "Reintentar el mapa" })).toBeVisible();

    const lista = page.getByRole("list", { name: "Incidencias" });
    await expect(page.getByRole("heading", { name: "Incidencias de demostración (lista)" })).toBeVisible();
    await expect(lista.getByRole("listitem").first()).toBeVisible();

    await elegirFiltro(page, "Tipo de reporte", /^Luminaria/);
    await cerrarHojaDeFiltros(page);
    await expect(page).toHaveURL(/categoria=luminaria/);
    await expect(lista.getByRole("listitem").first().getByRole("heading")).toContainText("Luminaria");
    await sinDesplazamientoHorizontal(page);

    // «Cambiar a la vista Lista» lleva a la lista completa con los mismos filtros.
    await aviso.getByRole("button", { name: "Cambiar a la vista Lista" }).click();
    await expect(page).toHaveURL(/vista=lista&categoria=luminaria/);
    await expect(page.getByRole("heading", { level: 2, name: "Incidencias de demostración", exact: true })).toBeVisible();
    await expect(page.getByRole("alert").filter({ hasText: "No pudimos cargar el mapa." })).toHaveCount(0);
  });

  test("la capa de demanda de bienestar agregada sólo aparece para operación", async ({ page }) => {
    await page.goto("/mapa");
    await esperarTitulo(page);
    const leyenda = page.getByRole("region", { name: "Capas y leyenda" });
    await expect(leyenda.getByRole("heading", { name: "Incidencias de demostración" })).toBeVisible();
    await expect(leyenda.getByText(/La prioridad del servicio no se decide por popularidad/)).toBeVisible();
    await expect(leyenda.getByRole("heading", { name: "Información territorial oficial" })).toBeVisible();
    await expect(leyenda.getByRole("heading", { name: "Demanda de bienestar agregada" })).toHaveCount(0);
    await expect(page.getByText("Datos ficticios agregados; no provienen de conversaciones.")).toHaveCount(0);

    await cambiarIdentidad(page, "Carmen Dzib");
    const capa = leyenda.locator('[data-capa="demanda_bienestar_agregada"]');
    await expect(capa.getByRole("heading", { name: "Demanda de bienestar agregada" })).toBeVisible();
    await expect(capa.getByText("Datos ficticios agregados; no provienen de conversaciones.").first()).toBeVisible();
    await expect(capa.getByText(/zonas? se ocultan? por tener menos de 10 registros/)).toBeVisible();
    const interruptor = capa.getByRole("switch", { name: "Mostrar en el mapa" });
    await expect(interruptor).toHaveAttribute("aria-checked", "false");
    await interruptor.click();
    await expect(interruptor).toHaveAttribute("aria-checked", "true");
    await expect(page).toHaveURL(/bienestar=1/);
    await esperarMapaListo(page);

    // Al volver a ciudadanía la capa desaparece aunque la URL la pida.
    await cambiarIdentidad(page, "Ana Ek");
    await expect(leyenda.locator('[data-capa="demanda_bienestar_agregada"]')).toHaveCount(0);
  });

  test("el Visor no tiene violaciones de accesibilidad graves en mapa ni en lista", async ({ page }) => {
    await page.goto("/mapa?capa=celdas");
    await esperarTitulo(page);
    await esperarMapaListo(page);
    await sinDesplazamientoHorizontal(page);
    await revisarAccesibilidad(page);

    await page.goto("/mapa?vista=lista");
    await esperarTitulo(page);
    await expect(page.getByRole("list", { name: "Incidencias" }).getByRole("listitem").first()).toBeVisible();
    await sinDesplazamientoHorizontal(page);
    await revisarAccesibilidad(page);
  });
});
