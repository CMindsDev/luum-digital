import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { esperarTitulo, revisarAccesibilidad, sinDesplazamientoHorizontal } from "./helpers";

/**
 * Búsqueda global en lenguaje natural (brief §8): las seis consultas del brief producen una intención
 * con acciones concretas y cada acción abre una vista interna del prototipo.
 */

interface CasoBusqueda {
  consulta: string;
  intencion: string;
  /** Primera acción (la más útil) y la ruta interna que abre. */
  accion: RegExp;
  ruta: RegExp;
}

const CASOS: CasoBusqueda[] = [
  { consulta: "Quiero reportar un bache", intencion: "Reportar un problema en la calle", accion: /^Reportar: Bache/, ruta: /\/reportes\/nuevo\/bache$/ },
  {
    consulta: "Necesito saber qué documentos pide este trámite",
    intencion: "Consultar los requisitos de un trámite",
    accion: /^Requisitos de/,
    ruta: /\/servicios\/[^/?#]+#requisitos$/,
  },
  { consulta: "Quiero consultar mi folio", intencion: "Consultar un folio", accion: /^Consultar mis reportes/, ruta: /\/reportes\/mis-reportes$/ },
  { consulta: "Busco apoyo psicológico", intencion: "Apoyo psicológico", accion: /^Abrir salud mental/, ruta: /\/bienestar\/salud-mental$/ },
  {
    consulta: "Quiero revisar un trámite de mi negocio",
    intencion: "Trámites para tu negocio",
    accion: /^Ver trámites para tu negocio/,
    ruta: /\/servicios\/categoria\/negocios$/,
  },
  { consulta: "Busco actividades culturales", intencion: "Cultura y actividades", accion: /^Ver cultura y actividades/, ruta: /\/servicios\/categoria\/cultura$/ },
];


function respuestaBusqueda(consulta: string) {
  const texto = consulta.trim().toLowerCase();
  if (texto.includes("licencia de funcionamiento")) {
    return {
      respuesta: "Puedes revisar la ficha del trámite [1] y confirmar los requisitos antes de empezar [2].",
      generada: true,
      citas: [
        { n: 1, titulo: "Licencia de funcionamiento", ruta: "/servicios/licencia-funcionamiento", fechaConsulta: "2026-10-10" },
        { n: 2, titulo: "Requisitos del trámite", ruta: "/servicios/licencia-funcionamiento#requisitos", fechaConsulta: "2026-10-09" },
      ],
      pasajes: [
        {
          id: "pasaje-licencia",
          tipo: "servicio",
          titulo: "Licencia de funcionamiento",
          texto: "Antes de iniciar revisa la ficha del servicio, los requisitos y el apartado de costos para preparar tus documentos.",
          fuente: { titulo: "Catálogo de servicios", fechaConsulta: "2026-10-08" },
          ruta: "/servicios/licencia-funcionamiento",
        },
      ],
      intencion: { categoria: "consulta_tramite", modo: "shadow" },
    };
  }
  return { respuesta: null, generada: false, citas: [], pasajes: [], intencion: { categoria: null, modo: "shadow" } };
}

async function buscarDesdeInicio(page: Page, consulta: string) {
  await page.goto("/");
  await esperarTitulo(page);
  const buscador = page.getByRole("search", { name: "Describe lo que necesitas" });
  await buscador.getByRole("searchbox").fill(consulta);
  await buscador.getByRole("searchbox").press("Enter");
  await expect(page.locator("#contenido h1")).toHaveText("Buscar");
}

test.describe("Búsqueda en lenguaje natural", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/asistente/busqueda", async (ruta) => {
      const datos = ruta.request().postDataJSON() as { consulta?: string } | null;
      await ruta.fulfill({ status: 200, json: respuestaBusqueda(datos?.consulta ?? "") });
    });
  });

  for (const caso of CASOS) {
    test(`«${caso.consulta}» ofrece acciones que abren vistas internas`, async ({ page, baseURL }) => {
      await buscarDesdeInicio(page, caso.consulta);
      const panel = page.getByRole("region", { name: caso.intencion });
      await expect(panel).toBeVisible();
      const acciones = panel.getByRole("list", { name: "Acciones sugeridas" }).getByRole("link");
      expect(await acciones.count()).toBeGreaterThan(0);
      // Todas las acciones son rutas internas (nunca un sitio externo).
      for (const href of await acciones.evaluateAll((enlaces) => enlaces.map((enlace) => enlace.getAttribute("href") ?? ""))) {
        expect(href.startsWith("/")).toBe(true);
      }
      await sinDesplazamientoHorizontal(page);
      await panel.getByRole("link", { name: caso.accion }).first().click();
      await expect(page).toHaveURL(caso.ruta);
      expect(new URL(page.url()).origin).toBe(new URL(baseURL ?? page.url()).origin);
      await esperarTitulo(page);
    });
  }

  test("cada resultado del catálogo abre su ficha interna", async ({ page }) => {
    await page.goto("/buscar?q=licencia%20de%20funcionamiento");
    await esperarTitulo(page);
    const resultados = page.getByRole("region", { name: "Fichas del catálogo" });
    await expect(resultados).toBeVisible();
    const primero = resultados.getByRole("link").first();
    const href = await primero.getAttribute("href");
    expect(href).toMatch(/^\/servicios\/[^/]+$/);
    await primero.click();
    await expect(page).toHaveURL(new RegExp(`${href ?? ""}$`));
    await esperarTitulo(page);
  });

  test("consultar un folio escrito lleva a la pantalla de seguimiento", async ({ page }) => {
    await buscarDesdeInicio(page, "Quiero consultar mi folio");
    const campo = page.getByRole("textbox", { name: "Tu folio de demostración" });
    await page.getByRole("button", { name: "Consultar folio" }).click();
    await expect(campo).toHaveAttribute("aria-invalid", "true");
    await expect(campo).toBeFocused();
    await campo.fill("demo-g-1");
    await page.getByRole("button", { name: "Consultar folio" }).click();
    await expect(page).toHaveURL(/\/gestiones\?folio=DEMO-G-0000001$/);
    await esperarTitulo(page);
  });

  test("requisitos sin trámite abierto pregunta cuál y busca sus requisitos", async ({ page }) => {
    await buscarDesdeInicio(page, "Necesito saber qué documentos pide este trámite");
    const campo = page.getByRole("textbox", { name: "¿De qué trámite?" });
    await campo.fill("licencia de funcionamiento");
    await page.getByRole("button", { name: "Ver sus requisitos" }).click();
    await expect(page).toHaveURL(/\/buscar\?q=requisitos%20de%20licencia%20de%20funcionamiento$/);
    const panel = page.getByRole("region", { name: "Consultar los requisitos de un trámite" });
    await expect(panel.getByRole("link", { name: /^Requisitos de «/ }).first()).toBeVisible();
  });

  test("salud mental: ayuda inmediata visible y la consulta no queda en la URL", async ({ page }) => {
    await buscarDesdeInicio(page, "Busco apoyo psicológico");
    await expect(page.getByRole("region", { name: "Apoyo psicológico" })).toBeVisible();
    await expect(page).toHaveURL(/\/buscar$/);
    await page.getByRole("button", { name: "Ayuda inmediata" }).click();
    await expect(page.getByRole("dialog", { name: "Ayuda inmediata" })).toBeVisible();
  });

  test("sin resultados: estado vacío con sugerencias", async ({ page }) => {
    await page.goto("/buscar?q=xqzwv%20plmkj");
    await esperarTitulo(page);
    await expect(page.getByRole("heading", { name: "No encontré fichas del catálogo con esas palabras" })).toBeVisible();
    await page.getByRole("link", { name: "Busco actividades culturales" }).first().click();
    await expect(page).toHaveURL(/\/buscar\?q=Busco%20actividades%20culturales$/);
    await expect(page.getByRole("region", { name: "Cultura y actividades" })).toBeVisible();
  });

  test("muestra una respuesta citada con fuentes y enlaces internos", async ({ page }) => {
    await page.goto("/buscar?q=licencia%20de%20funcionamiento");
    await esperarTitulo(page);
    const respuesta = page.getByRole("region", { name: "Respuesta de Pekito" });
    await expect(respuesta).toBeVisible();
    await expect(respuesta.getByText(/Puedes revisar la ficha del trámite/)).toBeVisible();
    await respuesta.getByRole("button", { name: "Ir a la fuente 1" }).click();
    await expect(respuesta.getByText(/\[1\] Licencia de funcionamiento/)).toBeVisible();
    await expect(respuesta.getByRole("link", { name: "Ver ficha en la app" }).first()).toHaveAttribute("href", "/servicios/licencia-funcionamiento");
  });

  test.describe("si el servicio no está disponible", () => {
    test.use({ erroresPermitidos: [/status of 503/] });

    test("degrada en silencio sin romper la búsqueda", async ({ page }) => {
      await page.unroute("**/api/asistente/busqueda");
      await page.route("**/api/asistente/busqueda", async (ruta) => {
        await ruta.fulfill({ status: 503, json: { error: "Búsqueda no disponible", codigo: "sin_configuracion" } });
      });
      await page.goto("/buscar?q=licencia%20de%20funcionamiento");
      await esperarTitulo(page);
      await expect(page.getByRole("region", { name: "Respuesta de Pekito" })).toHaveCount(0);
      await expect(page.getByRole("region", { name: "Fichas del catálogo" })).toBeVisible();
    });
  });

  test("búsqueda sin violaciones graves de accesibilidad", async ({ page }) => {
    await page.goto("/buscar?q=Quiero%20reportar%20un%20bache");
    await esperarTitulo(page);
    await expect(page.getByRole("region", { name: "Fichas del catálogo" })).toBeVisible();
    await sinDesplazamientoHorizontal(page);
    await revisarAccesibilidad(page);
  });
});
