import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { esperarTitulo, navegarA, revisarAccesibilidad, sinDesplazamientoHorizontal } from "./helpers";

/**
 * Recorrido K (brief): consultar desde el catálogo servicios de empleo, cultura, negocios y bienestar
 * SIN salir a otra web. Se registran todas las navegaciones del marco principal y las pestañas nuevas:
 * todo debe quedarse en el origen de la app.
 */
const CATEGORIAS = [
  { id: "empleo", nombre: "Empleo" },
  { id: "cultura", nombre: "Cultura" },
  { id: "negocios", nombre: "Negocios" },
  { id: "bienestar", nombre: "Salud y bienestar" },
] as const;

function vigilarNavegacion(page: Page) {
  const urls: string[] = [];
  const paginasNuevas: Page[] = [];
  page.on("framenavigated", (marco) => {
    if (marco === page.mainFrame()) urls.push(marco.url());
  });
  page.context().on("page", (nueva) => paginasNuevas.push(nueva));
  // axe-core abre una página en blanco para consolidar resultados: sólo cuentan las que navegaron.
  const pestanasNuevas = () => paginasNuevas.map((nueva) => nueva.url()).filter((url) => url !== "about:blank");
  return { urls, pestanasNuevas };
}

test.describe("Recorrido K: catálogo sin salir de la app", () => {
  test("empleo, cultura, negocios y bienestar se consultan dentro de la app", async ({ page, baseURL }) => {
    const origen = new URL(baseURL ?? "http://localhost:5173").origin;
    const registro = vigilarNavegacion(page);

    await page.goto("/");
    await esperarTitulo(page);
    await navegarA(page, "servicios");
    await expect(page.getByRole("heading", { name: "¿Qué tan completo está este catálogo?" })).toBeVisible();
    await revisarAccesibilidad(page);

    for (const categoria of CATEGORIAS) {
      await test.step(categoria.nombre, async () => {
        await page.goto("/servicios");
        await esperarTitulo(page);
        await page.locator(`[data-guia="servicios.categoria_${categoria.id}"]`).click();
        await expect(page).toHaveURL(new RegExp(`/servicios/categoria/${categoria.id}$`));
        await expect(page.locator("#contenido h1")).toContainText(categoria.nombre.split(" ")[0] ?? categoria.nombre);
        await sinDesplazamientoHorizontal(page);

        const lista = page.getByRole("list", { name: `Servicios de ${categoria.nombre}` });
        await expect(lista).toBeVisible();
        const primera = lista.getByRole("listitem").first();
        const nombre = (await primera.getByRole("heading").textContent())?.trim() ?? "";
        await primera.getByRole("link", { name: /^Ver ficha/ }).click();

        await expect(page).toHaveURL(/\/servicios\/[^/]+$/);
        await expect(page.locator("#contenido h1")).toHaveText(nombre);
        await expect(page.locator("#contenido [data-estados-servicio]").first()).toBeVisible();
        await expect(page.getByRole("heading", { name: "Requisitos", level: 2 })).toBeVisible();
        await sinDesplazamientoHorizontal(page);

        // El recorrido también es interno (puente a otro módulo de la app, nunca a otra web).
        await page.locator('[data-guia="servicios.iniciar"]').click();
        await expect(page).toHaveURL(/\/servicios\/[^/]+\/iniciar/);
        await esperarTitulo(page);
        await sinDesplazamientoHorizontal(page);
        const puente = page.locator('[data-guia="servicios.ir_modulo"]');
        if (await puente.count()) {
          const destino = (await puente.getAttribute("href")) ?? "";
          expect(destino.startsWith("/"), `El puente ${destino} debe ser una ruta interna`).toBe(true);
        }
      });
    }

    // Los enlaces oficiales existen como referencia y abren otra pestaña, pero no se siguieron.
    for (const url of registro.urls) expect(new URL(url).origin, `Navegación fuera de la app: ${url}`).toBe(origen);
    expect(registro.pestanasNuevas()).toEqual([]);
  });

  test("filtros del catálogo por estado de información y tipo de recorrido", async ({ page }) => {
    await page.goto("/servicios?categoria=cultura&info=verificada");
    await esperarTitulo(page);
    await expect(page.getByRole("heading", { name: "Resultados", level: 2 })).toBeVisible();
    const tarjetas = page.getByRole("list", { name: "Servicios encontrados" }).getByRole("listitem");
    await expect(tarjetas.first()).toBeVisible();
    // Todas las tarjetas mostradas cumplen el filtro de información verificada.
    const pendientes = page.getByRole("list", { name: "Servicios encontrados" }).locator('[data-info="pendiente"]');
    await expect(pendientes).toHaveCount(0);
    await page.getByRole("button", { name: "Limpiar todo" }).click();
    await expect(page).toHaveURL(/\/servicios$/);
    await expect(page.getByRole("heading", { name: "Categorías", level: 2 })).toBeVisible();
    await sinDesplazamientoHorizontal(page);
  });

  test("cada tipo de recorrido abre una pantalla interna accesible", async ({ page }) => {
    const casos = [
      { id: "mid-abm-001", texto: "Prepara tu gestión" },
      { id: "mid-bih-400", texto: "Solicitud de cita (simulada)" },
      { id: "mid-ftm-201", texto: "Pago de predial (simulado)" },
      { id: "registro-regulaciones", texto: "Consulta de regulaciones y documentos" },
      { id: "mid-cat-039", texto: "Consulta en el Visor Urbano del prototipo" },
      { id: "mid-obp-275", texto: "Haz tu reporte en Reportes" },
      { id: "padron-visitadores", texto: "Consulta una credencial de ejemplo" },
    ];
    for (const caso of casos) {
      await test.step(caso.id, async () => {
        await page.goto(`/servicios/${caso.id}/iniciar`);
        await esperarTitulo(page);
        await expect(page.getByRole("heading", { name: caso.texto, level: 2 })).toBeVisible();
        await sinDesplazamientoHorizontal(page);
        await revisarAccesibilidad(page);
      });
    }
  });
});
