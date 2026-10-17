import { expect, test } from "./fixtures";
import { esperarTitulo, navegarA, revisarAccesibilidad, sinDesplazamientoHorizontal } from "./helpers";

/**
 * Recorrido A (brief): desde Inicio buscar un servicio, abrir su ficha interna, empezar una gestión
 * simulada (reutilizando datos del expediente con confirmación), obtener un folio DEMO-G y verla en
 * «Mis gestiones». Todo ocurre dentro de la app y se rotula como simulación.
 */
const SERVICIO = "Atención Ciudadana por medios digitales";

test.describe("Recorrido A: trámite simulado de principio a fin", () => {
  test("buscar → ficha → solicitud simulada → folio DEMO-G → Mis gestiones", async ({ page }) => {
    await test.step("Inicio: buscar en lenguaje natural", async () => {
      await page.goto("/");
      await esperarTitulo(page);
      const buscador = page.getByRole("search", { name: "Describe lo que necesitas" });
      await buscador.getByRole("searchbox").fill("atención ciudadana por medios digitales");
      await buscador.getByRole("searchbox").press("Enter");
      await expect(page).toHaveURL(/\/buscar/);
    });

    await test.step("Abrir la ficha interna del servicio", async () => {
      const resultados = page.getByRole("region", { name: "Fichas del catálogo" });
      await resultados.getByRole("link", { name: new RegExp(`^${SERVICIO}`) }).first().click();
      await expect(page).toHaveURL(/\/servicios\/mid-pac-404$/);
      await expect(page.locator("#contenido h1")).toHaveText(SERVICIO);
      // Dos ejes por separado + fuente oficial con fecha.
      const estados = page.locator("#contenido [data-estados-servicio]").first();
      await expect(estados.locator('[data-info="verificada"]')).toBeVisible();
      await expect(estados.locator('[data-integracion="simulada"]')).toBeVisible();
      await expect(estados.getByRole("link", { name: /Portal Ciudadano · Ficha MID-PAC-404/ })).toHaveAttribute("target", "_blank");
      await expect(page.getByRole("heading", { name: "Requisitos", level: 2 })).toBeVisible();
      await sinDesplazamientoHorizontal(page);
      await revisarAccesibilidad(page);
    });

    await test.step("Empezar la solicitud simulada", async () => {
      await page.locator('[data-guia="servicios.iniciar"]').click();
      await expect(page).toHaveURL(/\/servicios\/mid-pac-404\/iniciar$/);
      await esperarTitulo(page);
      await expect(page.getByText("Simulación: no realiza gestiones oficiales")).toBeVisible();
    });

    await test.step("Reutilizar datos del expediente campo por campo", async () => {
      await page.getByRole("button", { name: "Usar datos de mi expediente" }).click();
      const dialogo = page.getByRole("dialog", { name: "Usar datos de mi expediente" });
      await expect(dialogo).toBeVisible();
      await expect(dialogo.getByRole("button", { name: "Elige al menos un dato" })).toBeDisabled();
      await dialogo.getByRole("checkbox", { name: "Nombre completo" }).check();
      await dialogo.getByRole("checkbox", { name: "Correo electrónico" }).check();
      await dialogo.getByRole("button", { name: "Copiar 2 datos" }).click();
      await expect(dialogo).toBeHidden();
      await expect(page.getByRole("textbox", { name: /Nombre completo/ })).toHaveValue("Ana Ek Canché");
      await expect(page.getByRole("textbox", { name: /Correo electrónico/ })).toHaveValue("ana.ek@ejemplo.mx");
    });

    await test.step("Validar, completar y revisar", async () => {
      await page.getByRole("button", { name: "Revisar solicitud" }).click();
      await expect(page.getByRole("textbox", { name: /Teléfono/ })).toBeFocused();
      await page.getByRole("textbox", { name: /Teléfono/ }).fill("999 000 0000");
      await page.getByRole("textbox", { name: /¿Qué necesitas\?/ }).fill("Quiero conocer los canales digitales de atención.");
      await page.getByRole("checkbox", { name: /Entiendo que es una simulación/ }).check();
      await page.getByRole("button", { name: "Revisar solicitud" }).click();
      await expect(page.getByRole("heading", { name: "Revisa antes de enviar" })).toBeVisible();
      await expect(page.getByText("De tu expediente")).toHaveCount(2);
      await sinDesplazamientoHorizontal(page);
    });

    let folio = "";
    await test.step("Enviar y recibir folio DEMO-G", async () => {
      await page.getByRole("button", { name: "Enviar solicitud simulada" }).click();
      await expect(page).toHaveURL(/\/gestiones\/[^/]+$/);
      const exito = page.locator("[data-folio]");
      await expect(exito).toBeVisible();
      folio = (await exito.getAttribute("data-folio")) ?? "";
      expect(folio).toMatch(/^DEMO-G-\d{7}$/);
      await expect(page.locator("#contenido h1")).toHaveText(SERVICIO);
      await expect(page.locator('[data-estado-gestion="enviada"]').first()).toBeVisible();
      await revisarAccesibilidad(page);
    });

    await test.step("Verla en Mis gestiones y encontrarla por folio", async () => {
      await navegarA(page, "gestiones");
      await expect(page.getByRole("article").filter({ hasText: folio })).toBeVisible();
      await page.getByRole("textbox", { name: "Folio de la gestión" }).fill(folio.toLowerCase().replace(/-/g, ""));
      await page.getByRole("search", { name: "Buscar por folio" }).getByRole("button", { name: "Buscar" }).click();
      const encontrada = page.getByRole("region", { name: "Buscar por folio" }).getByRole("article");
      await expect(encontrada).toContainText(folio);
      await sinDesplazamientoHorizontal(page);
    });

    await test.step("La notificación del envío aparece en Notificaciones", async () => {
      await navegarA(page, "notificaciones");
      await expect(page.getByRole("heading", { name: `Gestión ${folio} enviada` })).toBeVisible();
    });
  });

  test("guardar borrador y continuarlo desde Mis gestiones", async ({ page }) => {
    await page.goto("/servicios/mid-pac-404/iniciar");
    await esperarTitulo(page);
    await page.getByRole("textbox", { name: /Nombre completo/ }).fill("Persona de Ejemplo");
    await page.getByRole("button", { name: "Guardar borrador" }).click();
    await expect(page.getByText("Borrador guardado")).toBeVisible();

    await navegarA(page, "gestiones");
    const tarjeta = page.getByRole("article").filter({ hasText: SERVICIO }).filter({ hasText: "Sin folio (borrador)" });
    await tarjeta.getByRole("link", { name: /Ver detalle/ }).click();
    await esperarTitulo(page);
    await page.locator('[data-guia="gestiones.continuar"]').click();
    await expect(page).toHaveURL(/\/servicios\/mid-pac-404\/iniciar\?borrador=/);
    await expect(page.getByRole("textbox", { name: /Nombre completo/ })).toHaveValue("Persona de Ejemplo");
  });
});
