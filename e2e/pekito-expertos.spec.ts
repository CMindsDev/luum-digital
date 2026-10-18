import { test, expect } from "./fixtures";
import { esperarTitulo, revisarAccesibilidad, sinDesplazamientoHorizontal } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/asistente/estado", (ruta) => ruta.fulfill({
    json: { realtime: { disponible: false }, clef: { disponible: false, modo: "off" }, bienestarIaReal: false },
  }));
});

test("Peekito enruta preguntas y hace morph automáticamente sobre fondo crema, sin selector", async ({ page }) => {
  await page.goto("/");
  await esperarTitulo(page);
  await page.locator('[data-guia="asistente.abrir"]').click();
  await page.getByRole("button", { name: "Saltar", exact: true }).click();
  const panel = page.locator('[data-guia="asistente.panel"]');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("heading", { name: "PEEKITO", exact: true })).toBeVisible();
  await expect(panel).toHaveCSS("background-color", "rgb(255, 248, 236)");
  const reducido = await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  await expect(panel.getByRole("combobox")).toHaveCount(0);
  const presencia = page.locator('[data-asistente-ui][data-lado]').first();
  await expect(presencia.locator("[data-pekito-animado]")).toHaveAttribute("data-experto", "general");

  for (const [pregunta, experto, archivo, fondo] of [
    ["Háblame de catastro", "urbano", "urbano.svg", "rgb(234, 244, 227)"],
    ["Explica el reglamento municipal", "juridico", "juridico.svg", "rgb(255, 231, 190)"],
    ["Explícame los trámites municipales", "tramites", "tortuga.svg", "rgb(230, 239, 253)"],
    ["Qué es la recolección de basura", "medio_ambiente", "iguana.svg", "rgb(242, 250, 217)"],
    ["Hola Peekito", "general", "pekito-mascota.svg", "rgb(253, 230, 243)"],
  ]) {
    await panel.getByRole("textbox", { name: "Escribe a Peekito" }).fill(pregunta);
    await expect(panel.getByRole("button", { name: "Enviar", exact: true })).toBeEnabled();
    const morph = reducido ? Promise.resolve(0) : presencia.evaluate((elemento) => new Promise<number>((resolve) => {
      let inicio: number | null = null;
      const observador = new MutationObserver(() => {
        const capas = elemento.querySelectorAll("[data-avatar-capa]").length;
        if (capas >= 2 && inicio === null) inicio = performance.now();
        if (capas !== 1 || inicio === null) return;
        observador.disconnect();
        clearTimeout(limite);
        resolve(performance.now() - inicio);
      });
      const limite = setTimeout(() => { observador.disconnect(); resolve(-1); }, 5000);
      observador.observe(elemento, { childList: true, subtree: true });
    }));
    await panel.getByRole("button", { name: "Enviar", exact: true }).click();
    const estadoExperto = panel.locator('[data-guia="asistente.experto"]');
    if (!reducido) {
      await expect(estadoExperto).toContainText("Cambiando al experto…");
      await expect(estadoExperto.locator(".pekito-progreso-experto")).toHaveCSS("animation-duration", "1.4s");
      expect(await morph, "El morph debe ser perceptible y durar al menos 1.2 s").toBeGreaterThanOrEqual(1200);
    }
    const figura = presencia.locator(`[data-pekito-animado][data-experto="${experto}"]`);
    await expect(figura).toBeVisible();
    await expect(figura.locator("[data-avatar-capa]")).toHaveCount(1);
    await expect(figura.locator("image")).toHaveAttribute("href", `/brand/laboratorio/agente/${archivo}`);
    const recurso = await page.request.get(`/brand/laboratorio/agente/${archivo}`);
    expect(recurso.ok()).toBe(true);
    expect((await recurso.body()).length).toBeGreaterThan(100);

    await expect(estadoExperto).toHaveAttribute("data-cambiando", "false");
    await expect(presencia.locator(".pekito-orbe")).toHaveCSS("background-color", fondo);
    if (reducido) {
      const duracion = await presencia.locator(".pekito-orbe").evaluate((orbe) => parseFloat(getComputedStyle(orbe).transitionDuration));
      expect(duracion).toBeLessThan(0.001);
    } else await expect(presencia.locator(".pekito-orbe")).toHaveCSS("transition-duration", "1.4s, 1.4s, 0.18s");
    if (reducido) expect(await figura.locator("[data-avatar-capa]").evaluate((capa) => getComputedStyle(capa).filter)).toBe("none");
    await sinDesplazamientoHorizontal(page);
    await revisarAccesibilidad(page);
  }
});

test("al cerrar el panel el cambio conserva feedback en la burbuja flotante", async ({ page }) => {
  await page.goto("/");
  await esperarTitulo(page);
  await page.locator('[data-guia="asistente.abrir"]').click();
  await page.getByRole("button", { name: "Saltar", exact: true }).click();
  const panel = page.locator('[data-guia="asistente.panel"]');
  const reducido = await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  await panel.getByRole("textbox", { name: "Escribe a Peekito" }).fill("Háblame de catastro");
  await panel.getByRole("button", { name: "Enviar", exact: true }).click();
  if (!reducido) await expect(panel.locator('[data-guia="asistente.experto"]')).toContainText("Cambiando al experto…");
  await panel.getByRole("button", { name: "Cerrar Peekito" }).click();
  const linea = page.locator('[data-guia="asistente.linea"]');
  if (!reducido) await expect(linea).toContainText("Cambiando al experto…");
  await expect(linea).not.toContainText("Cambiando al experto…");
  await expect(panel).toBeHidden();
  await sinDesplazamientoHorizontal(page);
});

test("Alma usa lila y reconoce el tema en maya; abrir información de ayuda no traslada la conversación", async ({ page }) => {
  await page.goto("/");
  await esperarTitulo(page);
  await page.locator('[data-guia="asistente.abrir"]').click();
  await page.getByRole("button", { name: "Saltar", exact: true }).click();
  const panel = page.locator('[data-guia="asistente.panel"]');
  await panel.getByRole("textbox", { name: "Escribe a Peekito" }).fill("¿Dónde encuentro Toj óolal?");
  await panel.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(page.locator('[data-asistente-ui][data-lado]').first().locator("[data-pekito-animado]")).toHaveAttribute("data-experto", "bienestar");
  await expect(page.locator('[data-guia="asistente.abrir"]')).toHaveCSS("background-color", "rgb(238, 232, 252)");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('[data-guia="salud_mental.ayuda_inmediata"]')).toHaveCount(0);
  await revisarAccesibilidad(page);
  await panel.getByRole("textbox", { name: "Escribe a Peekito" }).fill("Busco apoyo psicológico");
  await panel.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(page).toHaveURL(/\/bienestar\/salud-mental$/);
  await expect(page.locator('[data-guia="salud_mental.ayuda_inmediata"]')).toBeVisible();
  await expect(page.getByText("Busco apoyo psicológico", { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => Object.values(localStorage).join(" ").includes("Busco apoyo psicológico"))).toBe(false);
});

test("Alma usa su avatar y keyframes en salud mental y se puede ocultar sin perder ayuda", async ({ page }) => {
  await page.goto("/bienestar/salud-mental");
  await esperarTitulo(page);
  await expect(page.locator('[data-guia="asistente.abrir"]')).toHaveCount(0);
  const figura = page.locator('[data-pekito-animado][data-experto="bienestar"]');
  await expect(figura).toBeVisible();
  await expect(figura.locator("image")).toHaveAttribute("href", "/brand/laboratorio/agente/alma.svg");
  const animacion = await figura.evaluate((svg) => {
    svg.setAttribute("data-estado", "pensando");
    const cuerpo = svg.querySelector(".pk-cuerpo");
    if (!cuerpo) throw new Error("Falta el cuerpo de Alma");
    return { reducida: matchMedia("(prefers-reduced-motion: reduce)").matches, nombre: getComputedStyle(cuerpo).animationName };
  });
  expect(animacion.nombre).toBe(animacion.reducida ? "none" : "alma-piensa");
  await page.getByRole("switch", { name: "Mostrar la figura del acompañante" }).click();
  await expect(figura).toHaveCount(0);
  await expect(page.locator('[data-guia="salud_mental.ayuda_inmediata"]')).toBeVisible();
  await sinDesplazamientoHorizontal(page);
});
