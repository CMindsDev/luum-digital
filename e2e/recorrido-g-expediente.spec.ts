import { expect, test } from "./fixtures";
import { cambiarIdentidad, esperarTitulo, navegarA, revisarAccesibilidad, sinDesplazamientoHorizontal } from "./helpers";

/**
 * Recorrido G (brief §9): abrir el Expediente Digital de ejemplo, consultar documentos ficticios
 * («DOCUMENTO DE EJEMPLO») y, en un trámite con formulario, usar «Usar datos de mi expediente»,
 * confirmar campo por campo y ver los datos reutilizados en la gestión simulada.
 */

test.describe("Recorrido G: Expediente Digital", () => {
  test("perfil ficticio y documentos de ejemplo con su marca", async ({ page }) => {
    await test.step("Abrir Mi expediente desde la navegación", async () => {
      await page.goto("/");
      await esperarTitulo(page);
      const h1 = await navegarA(page, "expediente");
      await expect(h1).toHaveText("Mi expediente");
      await expect(page.locator("#contenido h1")).toHaveCount(1);
    });

    await test.step("Cuenta compartida y datos ficticios, sin pedir documentos reales", async () => {
      const cuenta = page.getByRole("region", { name: "Cuenta de demostración compartida" });
      await expect(cuenta).toContainText("No es una cuenta ni una autenticación municipal");
      await expect(cuenta.getByRole("link", { name: /Expediente Digital del Ayuntamiento de Mérida/ })).toHaveAttribute("target", "_blank");
      const perfil = page.getByRole("region", { name: "Perfil ficticio" });
      await expect(perfil.getByText("Datos ficticios de demostración")).toBeVisible();
      await expect(perfil.getByText("ana.ek@ejemplo.mx")).toBeVisible();
      await expect(page.getByRole("textbox", { name: /CURP|INE|comprobante/i })).toHaveCount(0);
      await expect(page.locator('input[type="file"]')).toHaveCount(0);
      await expect(page.getByRole("switch", { name: "Pedir confirmación antes de reutilizar mis datos" })).toBeDisabled();
      await sinDesplazamientoHorizontal(page);
      await revisarAccesibilidad(page);
    });

    await test.step("Consultar un documento ficticio", async () => {
      const documentos = page.getByRole("region", { name: "Documentos de ejemplo" });
      await expect(documentos.getByRole("link")).toHaveCount(3);
      await documentos.getByRole("link", { name: /Identificación de ejemplo/ }).click();
      await expect(page).toHaveURL(/\/expediente\/documentos\/doc-ana-identificacion$/);
      await expect(await esperarTitulo(page)).toHaveText("Identificación de ejemplo");
      const vistaPrevia = page.getByRole("figure", { name: "Identificación de ejemplo" });
      await expect(vistaPrevia.getByText("DOCUMENTO DE EJEMPLO", { exact: true })).toBeVisible();
      await expect(vistaPrevia).toContainText("Sin validez oficial");
      await expect(page.getByRole("link", { name: /descargar/i })).toHaveCount(0);
      await expect(page.getByRole("region", { name: "Gestiones donde se usó" }).getByRole("link")).toContainText(
        "Copia Simple de Cédula Catastral Vigente",
      );
      await sinDesplazamientoHorizontal(page);
      await revisarAccesibilidad(page);
    });

    await test.step("Volver al expediente", async () => {
      await page.getByRole("link", { name: "Volver a mi expediente" }).click();
      await expect(page).toHaveURL(/\/expediente$/);
      await expect(await esperarTitulo(page)).toHaveText("Mi expediente");
    });
  });

  test("usar datos de mi expediente en un trámite con confirmación campo por campo", async ({ page }) => {
    let servicio = "";

    await test.step("Elegir un trámite con formulario desde el expediente", async () => {
      await page.goto("/expediente");
      await esperarTitulo(page);
      const tarjeta = page.locator('[data-guia="expediente.tramites_con_formulario"] [data-servicio-id]').first();
      await expect(tarjeta).toBeVisible();
      const servicioId = (await tarjeta.getAttribute("data-servicio-id")) ?? "";
      expect(servicioId).not.toBe("");
      await tarjeta.click();
      await expect(page).toHaveURL(new RegExp(`/servicios/${servicioId}$`));
      // La ficha carga en diferido: espera a que el h1 ya no sea el del expediente.
      await expect(page.locator("#contenido h1")).not.toHaveText("Mi expediente");
      servicio = (await (await esperarTitulo(page)).textContent())?.trim() ?? "";
      expect(servicio).not.toBe("");
      await page.locator('[data-guia="servicios.iniciar"]').click();
      await expect(page).toHaveURL(new RegExp(`/servicios/${servicioId}/iniciar$`));
      await esperarTitulo(page);
    });

    await test.step("Confirmar uno por uno los datos que se copian", async () => {
      await page.getByRole("button", { name: "Usar datos de mi expediente" }).click();
      const dialogo = page.getByRole("dialog", { name: "Usar datos de mi expediente" });
      await expect(dialogo).toBeVisible();
      await expect(dialogo.getByRole("checkbox", { name: "Teléfono" })).toBeVisible();
      for (const casilla of await dialogo.getByRole("checkbox").all()) await expect(casilla).not.toBeChecked();
      await expect(dialogo.getByRole("button", { name: "Elige al menos un dato" })).toBeDisabled();
      await dialogo.getByRole("checkbox", { name: "Nombre completo" }).check();
      await dialogo.getByRole("checkbox", { name: "Correo electrónico" }).check();
      await dialogo.getByRole("button", { name: "Copiar 2 datos" }).click();
      await expect(dialogo).toBeHidden();
      await expect(page.getByRole("textbox", { name: /Nombre completo/ })).toHaveValue("Ana Ek Canché");
      await expect(page.getByRole("textbox", { name: /Correo electrónico/ })).toHaveValue("ana.ek@ejemplo.mx");
      // Lo que no se confirmó no se copia.
      await expect(page.getByRole("textbox", { name: /Teléfono/ })).toHaveValue("");
    });

    await test.step("Completar, revisar y enviar la solicitud simulada", async () => {
      await page.getByRole("textbox", { name: /Teléfono/ }).fill("999 000 0000");
      await page.getByRole("textbox", { name: /¿Qué necesitas\?/ }).fill("Solicitud de ejemplo para el recorrido del expediente.");
      await page.getByRole("checkbox", { name: /Entiendo que es una simulación/ }).check();
      await page.getByRole("button", { name: "Revisar solicitud" }).click();
      await expect(page.getByRole("heading", { name: "Revisa antes de enviar" })).toBeVisible();
      await expect(page.getByText("De tu expediente", { exact: true })).toHaveCount(2);
      await page.getByRole("button", { name: "Enviar solicitud simulada" }).click();
      await expect(page).toHaveURL(/\/gestiones\/[^/]+$/);
      await expect(page.locator("#contenido h1")).toHaveText(servicio);
    });

    let folio = "";
    await test.step("Ver en la gestión los datos reutilizados", async () => {
      folio = (await page.locator("[data-folio]").first().getAttribute("data-folio")) ?? "";
      expect(folio).toMatch(/^DEMO-G-\d{7}$/);
      const reutilizados = page.getByRole("region", { name: "Datos de tu expediente" });
      await expect(reutilizados).toContainText("Nombre completo");
      await expect(reutilizados).toContainText("Correo electrónico");
      await expect(reutilizados).not.toContainText("Teléfono");
    });

    await test.step("La gestión aparece en el expediente con los datos que se usaron", async () => {
      await navegarA(page, "expediente");
      const relacionada = page.getByRole("region", { name: "Gestiones relacionadas" }).getByRole("listitem").filter({ hasText: folio });
      await expect(relacionada).toBeVisible();
      await expect(relacionada).toContainText(servicio);
      await expect(relacionada).toContainText("Nombre completo: Ana Ek Canché");
      await expect(relacionada).toContainText("Correo electrónico: ana.ek@ejemplo.mx");
      await expect(relacionada).not.toContainText("Teléfono:");
      await sinDesplazamientoHorizontal(page);
    });
  });

  test("práctica sin envío y privacidad con explicaciones", async ({ page }) => {
    await page.goto("/expediente");
    await esperarTitulo(page);

    await test.step("Práctica: copiar sólo el teléfono y comprobar", async () => {
      const practica = page.getByRole("region", { name: "Pruébalo sin enviar nada" });
      await practica.getByRole("button", { name: "Usar datos de mi expediente" }).click();
      const dialogo = page.getByRole("dialog", { name: "Usar datos de mi expediente" });
      await dialogo.getByRole("checkbox", { name: "Teléfono" }).check();
      await dialogo.getByRole("button", { name: "Copiar 1 dato" }).click();
      await expect(dialogo).toBeHidden();
      await expect(practica.getByRole("textbox", { name: /Teléfono/ })).toHaveValue("999 000 0001");
      await expect(practica.getByText("Copiado de tu expediente con tu confirmación")).toBeVisible();

      await practica.getByRole("button", { name: "Comprobar datos" }).click();
      await expect(practica.getByRole("textbox", { name: /Nombre completo/ })).toBeFocused();
      await expect(practica.getByRole("alert")).toHaveText("Revisa 2 campos marcados.");
      await practica.getByRole("textbox", { name: /Nombre completo/ }).fill("Persona de Ejemplo");
      await practica.getByRole("textbox", { name: /Correo electrónico/ }).fill("persona@ejemplo.mx");
      await practica.getByRole("button", { name: "Comprobar datos" }).click();
      await expect(practica.getByRole("heading", { name: "Datos comprobados" })).toBeFocused();
      await expect(practica).toContainText("1 vino de tu expediente con tu confirmación. No se envió ni se guardó nada.");
    });

    await test.step("Privacidad: notificaciones discretas", async () => {
      const privacidad = page.getByRole("region", { name: "Privacidad" });
      const confirmacion = privacidad.getByRole("switch", { name: "Pedir confirmación antes de reutilizar mis datos" });
      await expect(confirmacion).toBeChecked();
      await expect(confirmacion).toBeDisabled();
      const notificaciones = page.getByRole("region", { name: "Notificaciones recientes" });
      await expect(notificaciones.getByText("Vista previa oculta")).toHaveCount(0);

      await privacidad.getByRole("switch", { name: "Notificaciones discretas" }).click();
      await expect(privacidad.getByRole("switch", { name: "Notificaciones discretas" })).toBeChecked();
      await expect(page.getByText("Preferencia guardada")).toBeVisible();
      await expect(notificaciones.getByText("Vista previa oculta")).toHaveCount(3);

      await page.reload();
      await esperarTitulo(page);
      await expect(page.getByRole("region", { name: "Privacidad" }).getByRole("switch", { name: "Notificaciones discretas" })).toBeChecked();
      await revisarAccesibilidad(page);
    });
  });

  test("cada identidad ve sólo su expediente", async ({ page }) => {
    await page.goto("/expediente");
    await esperarTitulo(page);
    await cambiarIdentidad(page, "Carmen Dzib");
    const perfil = page.getByRole("region", { name: "Perfil ficticio" });
    await expect(perfil.getByText("operadora.demo@ejemplo.mx")).toBeVisible();
    await expect(page.getByRole("region", { name: "Documentos de ejemplo" }).getByText("Esta identidad no tiene documentos de ejemplo")).toBeVisible();
    await page.goto("/expediente/documentos/doc-ana-identificacion");
    await expect(await esperarTitulo(page)).toHaveText("Documento no encontrado");
  });
});
