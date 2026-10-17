import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { esMovil, esperarTitulo, revisarAccesibilidad, sinDesplazamientoHorizontal, TEXTO_ROTULO_DEMO } from "./helpers";

/** Inicio (brief §8 y tablero Figma 32:162): saludo, buscador, accesos, seguimiento y bandas temáticas. */

async function interceptarBusqueda(page: Page) {
  await page.route("**/api/asistente/busqueda", async (ruta) => {
    const datos = ruta.request().postDataJSON() as { consulta?: string } | null;
    const consulta = (datos?.consulta ?? "").trim().toLowerCase();
    const json = consulta.includes("licencia de funcionamiento")
      ? {
          respuesta: "Puedes iniciar el trámite desde su ficha [1].",
          generada: true,
          citas: [{ n: 1, titulo: "Licencia de funcionamiento", ruta: "/servicios/licencia-funcionamiento", fechaConsulta: "2026-10-10" }],
          pasajes: [],
          intencion: { categoria: "consulta_tramite", modo: "shadow" },
        }
      : { respuesta: null, generada: false, citas: [], pasajes: [], intencion: { categoria: null, modo: "shadow" } };
    await ruta.fulfill({ status: 200, json });
  });
}


const ACCESOS: { nombre: RegExp; ruta: RegExp }[] = [
  { nombre: /^Bache a la vista/, ruta: /\/reportes\/nuevo\/bache$/ },
  { nombre: /^Trámites y servicios$/, ruta: /\/servicios$/ },
  { nombre: /^Mis gestiones$/, ruta: /\/gestiones$/ },
  { nombre: /^Visor Urbano$/, ruta: /\/mapa$/ },
  { nombre: /^Bienestar$/, ruta: /\/bienestar$/ },
  { nombre: /^Mi expediente$/, ruta: /\/expediente$/ },
];

const TEMAS: { titulo: string; enlace: RegExp; ruta: RegExp }[] = [
  { titulo: "Salud y Bienestar", enlace: /^Ir a Bienestar/, ruta: /\/bienestar$/ },
  { titulo: "Seguridad y Protección", enlace: /^Línea Mujer/, ruta: /\/bienestar\/linea-mujer$/ },
  { titulo: "Movilidad y Tránsito", enlace: /^Buscar tránsito y movilidad/, ruta: /\/buscar\?q=tr%C3%A1nsito%20y%20movilidad$/ },
  { titulo: "Medio ambiente y sostenibilidad", enlace: /^Ver servicios de medio ambiente/, ruta: /\/servicios\/categoria\/medio_ambiente$/ },
  { titulo: "Trámites y Atención", enlace: /^Mis gestiones/, ruta: /\/gestiones$/ },
  { titulo: "Desarrollo Urbano y territorio", enlace: /^Abrir el mapa/, ruta: /\/mapa$/ },
];

test.describe("Inicio", () => {
  test.beforeEach(async ({ page }) => {
    await interceptarBusqueda(page);
  });

  test("saludo, rótulo de demostración y un solo h1", async ({ page }) => {
    await page.goto("/");
    const h1 = await esperarTitulo(page);
    await expect(h1).toHaveText("Hola, Ana");
    await expect(page.getByText("¿Qué quieres hacer hoy?")).toBeVisible();
    await expect(page.locator("#contenido h1")).toHaveCount(1);
    await expect(page.getByRole("link", { name: new RegExp(TEXTO_ROTULO_DEMO) })).toBeVisible();
    await expect(page.locator('[data-guia="inicio.buscador"]')).toBeVisible();
  });

  test("el buscador principal abre la búsqueda en lenguaje natural", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    const buscador = page.getByRole("search", { name: "Describe lo que necesitas" });
    await buscador.getByRole("searchbox").fill("licencia de funcionamiento");
    await buscador.getByRole("button", { name: "Buscar" }).click();
    await expect(page).toHaveURL(/\/buscar\?q=licencia%20de%20funcionamiento$/);
    await expect(page.locator("#contenido h1")).toHaveText("Buscar");
    await expect(page.getByRole("region", { name: "Trámites para tu negocio" })).toBeVisible();
  });

  test("los accesos rápidos abren módulos reales del AppShell", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    const accesos = page.getByRole("region", { name: "Accesos rápidos" });
    for (const acceso of ACCESOS) {
      await test.step(String(acceso.nombre), async () => {
        await accesos.getByRole("link", { name: acceso.nombre }).click();
        await expect(page).toHaveURL(acceso.ruta);
        await esperarTitulo(page);
        await page.goBack();
        await expect(page.locator("#contenido h1")).toHaveText("Hola, Ana");
      });
    }
  });

  test("resumen de mis gestiones y mis reportes de demostración", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    const gestiones = page.getByRole("region", { name: "Mis gestiones" });
    await expect(gestiones.getByText("Copia Simple de Cédula Catastral Vigente")).toBeVisible();
    await expect(gestiones.getByText("Simuladas")).toBeVisible();
    const reportes = page.getByRole("region", { name: "Mis reportes" });
    await expect(reportes.getByRole("link", { name: /Ver mis \d* ?reportes/ })).toBeVisible();
    await gestiones.getByRole("link", { name: /Copia Simple de Cédula Catastral Vigente/ }).click();
    await expect(page).toHaveURL(/\/gestiones\/[^/]+$/);
    await esperarTitulo(page);
  });

  test("seis bandas temáticas con enlaces a módulos reales", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    const temas = page.getByRole("region", { name: "Explora por tema" });
    for (const tema of TEMAS) {
      await test.step(tema.titulo, async () => {
        const banda = temas.getByRole("region", { name: tema.titulo });
        await banda.scrollIntoViewIfNeeded();
        await expect(banda.getByRole("heading", { level: 3, name: tema.titulo })).toBeVisible();
        await banda.getByRole("link", { name: tema.enlace }).click();
        await expect(page).toHaveURL(tema.ruta);
        await esperarTitulo(page);
        await page.goBack();
        await expect(page.locator("#contenido h1")).toHaveText("Hola, Ana");
      });
    }
  });

  test("Seguridad y Protección abre la ayuda inmediata con líneas humanas", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    const banda = page.getByRole("region", { name: "Seguridad y Protección" });
    const boton = banda.getByRole("button", { name: "Ayuda inmediata" });
    await boton.scrollIntoViewIfNeeded();
    await boton.click();
    const hoja = page.getByRole("dialog", { name: "Ayuda inmediata" });
    await expect(hoja).toBeVisible();
    await expect(hoja.getByRole("link", { name: /911/ }).first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(hoja).toBeHidden();
    await expect(boton).toBeFocused();
  });

  test("responsive: sin desplazamiento horizontal y bandas apiladas en móvil", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    await sinDesplazamientoHorizontal(page);
    const banda = page.locator('[data-tema="salud"]');
    await banda.scrollIntoViewIfNeeded();
    const titulo = await banda.getByRole("heading", { level: 3 }).boundingBox();
    const foto = await banda.locator("img").last().boundingBox();
    expect(titulo && foto).toBeTruthy();
    if (!titulo || !foto) return;
    const ancho = page.viewportSize()?.width ?? 1280;
    if (esMovil(page) || ancho < 1300) {
      // Una columna: la foto va debajo del texto.
      expect(foto.y).toBeGreaterThan(titulo.y + titulo.height);
    } else {
      // Dos columnas: texto y foto lado a lado.
      expect(foto.x).toBeGreaterThan(titulo.x + titulo.width / 2);
      expect(foto.y).toBeLessThan(titulo.y + titulo.height);
    }
    // Ningún titular de banda se sale de su banda.
    const desbordes = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("[data-tema]")].filter((seccion) => {
        const h3 = seccion.querySelector("h3");
        return h3 ? h3.scrollWidth > h3.clientWidth + 1 : false;
      }).length,
    );
    expect(desbordes).toBe(0);
    await sinDesplazamientoHorizontal(page);
  });

  test("inicio sin violaciones graves de accesibilidad", async ({ page }) => {
    await page.goto("/");
    await esperarTitulo(page);
    await expect(page.getByRole("region", { name: "Mis gestiones" }).getByText("Copia Simple de Cédula Catastral Vigente")).toBeVisible();
    await revisarAccesibilidad(page);
  });
});
