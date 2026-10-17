import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Secciones del AppShell (mismas que src/app/navigation.ts). */
export const SECCIONES_E2E = {
  inicio: { etiqueta: "Inicio", corta: "Inicio", ruta: "/", enBarraInferior: true },
  servicios: { etiqueta: "Trámites y servicios", corta: "Servicios", ruta: "/servicios", enBarraInferior: true },
  reportes: { etiqueta: "Reportes", corta: "Reportes", ruta: "/reportes", enBarraInferior: true },
  mapa: { etiqueta: "Mapa / Visor Urbano", corta: "Mapa", ruta: "/mapa", enBarraInferior: true },
  bienestar: { etiqueta: "Bienestar", corta: "Bienestar", ruta: "/bienestar", enBarraInferior: false },
  participacion: { etiqueta: "Participación y recompensas", corta: "Participación", ruta: "/participacion", enBarraInferior: false },
  expediente: { etiqueta: "Mi expediente", corta: "Expediente", ruta: "/expediente", enBarraInferior: false },
  gestiones: { etiqueta: "Mis gestiones", corta: "Gestiones", ruta: "/gestiones", enBarraInferior: false },
  notificaciones: { etiqueta: "Notificaciones", corta: "Notificaciones", ruta: "/notificaciones", enBarraInferior: false },
  operador: { etiqueta: "Operador de demostración", corta: "Operador", ruta: "/operador", enBarraInferior: false },
  cuenta: { etiqueta: "Cuenta de demostración", corta: "Cuenta", ruta: "/cuenta", enBarraInferior: false },
} as const;

export type SeccionE2E = keyof typeof SECCIONES_E2E;

export const TEXTO_ROTULO_DEMO = "Prototipo de demostración en Laboratorio de Innovación Digital. No realiza gestiones oficiales";

/** true en el proyecto móvil (barra inferior + «Más»); false con navegación lateral. */
export function esMovil(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1280) < 768;
}

function rutaComoPatron(ruta: string): RegExp {
  const escapada = ruta.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return ruta === "/" ? /\/(\?.*)?(#.*)?$/ : new RegExp(`${escapada}(\\?.*)?(#.*)?$`);
}

/** Espera a que la pantalla tenga su h1 visible y lo devuelve. */
export async function esperarTitulo(page: Page) {
  const h1 = page.locator("#contenido h1").first();
  await expect(h1).toBeVisible();
  await expect(h1).not.toBeEmpty();
  return h1;
}

/**
 * Navega con la navegación real: en móvil, barra inferior o la hoja «Más»; en tableta y
 * escritorio, la barra lateral. Verifica la URL y el h1.
 */
export async function navegarA(page: Page, seccion: SeccionE2E) {
  const datos = SECCIONES_E2E[seccion];
  const principal = page.getByRole("navigation", { name: "Principal" });
  if (esMovil(page)) {
    if (datos.enBarraInferior) {
      await principal.getByRole("link", { name: datos.corta, exact: true }).click();
    } else {
      await principal.getByRole("button", { name: "Más", exact: true }).click();
      const hoja = page.getByRole("dialog", { name: "Más secciones" });
      await expect(hoja).toBeVisible();
      await hoja.getByRole("link", { name: new RegExp(`^${datos.etiqueta.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}`) }).click();
      await expect(hoja).toBeHidden();
    }
  } else {
    await principal.getByRole("link", { name: datos.etiqueta, exact: true }).click();
  }
  await expect(page).toHaveURL(rutaComoPatron(datos.ruta));
  if (seccion === "operador") {
    await page.getByRole("link", { name: "Revisión y verificaciones", exact: true }).click();
    await expect(page).toHaveURL(/\/operador\/revision$/);
  }
  return esperarTitulo(page);
}

/** Abre el menú de identidad del encabezado. */
async function abrirMenuIdentidad(page: Page) {
  await page.getByRole("button", { name: /Identidad de demostración/ }).click();
}

/** Cambia la identidad ficticia desde el menú del encabezado (p. ej. "Carmen Dzib"). */
export async function cambiarIdentidad(page: Page, nombre: string) {
  await abrirMenuIdentidad(page);
  await page.getByRole("button", { name: new RegExp(nombre) }).click();
  if (nombre === "Carmen Dzib" || nombre === "Administración demo") {
    await expect(page.getByRole("heading", { level: 1, name: "Centro de operaciones" })).toBeVisible();
    await page.getByRole("link", { name: "Revisión y verificaciones", exact: true }).click();
  }
  await expect(page.getByRole("button", { name: new RegExp(`Identidad de demostración: ${nombre}`) })).toBeVisible();
}

/** Restablece la demostración desde el menú de identidad y espera a volver al inicio. */
export async function restablecerDemo(page: Page) {
  await abrirMenuIdentidad(page);
  await page.getByRole("button", { name: "Restablecer demostración" }).click();
  const dialogo = page.getByRole("dialog", { name: "¿Restablecer la demostración?" });
  await expect(dialogo).toBeVisible();
  await Promise.all([page.waitForURL(rutaComoPatron("/")), dialogo.getByRole("button", { name: "Sí, restablecer" }).click()]);
  await esperarTitulo(page);
}

/** Falla si la página tiene desplazamiento horizontal. */
export async function sinDesplazamientoHorizontal(page: Page) {
  const exceso = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(exceso, "La página no debe desplazarse horizontalmente").toBeLessThanOrEqual(1);
}

/** Revisa con axe-core (WCAG 2.x A/AA) y falla por violaciones «serious» o «critical». */
export async function revisarAccesibilidad(page: Page, { excluir = [] as string[] } = {}) {
  let constructor = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
  for (const selector of excluir) constructor = constructor.exclude(selector);
  const resultado = await constructor.analyze();
  const graves = resultado.violations
    .filter((violacion) => violacion.impact === "serious" || violacion.impact === "critical")
    .map((violacion) => ({
      regla: violacion.id,
      impacto: violacion.impact,
      descripcion: violacion.help,
      nodos: violacion.nodes.slice(0, 5).map((nodo) => nodo.target.join(" ")),
    }));
  expect(graves, "Violaciones de accesibilidad serias o críticas").toEqual([]);
}
