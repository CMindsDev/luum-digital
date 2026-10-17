import { test as base, expect } from "@playwright/test";

/**
 * Fixture común de los recorridos E2E:
 * - Bloquea toda red que no sea localhost/127.0.0.1 (sin red externa; los estilos de mapa se
 *   interceptan en sus propias pruebas con page.route, que tiene prioridad).
 * - Recolecta console.error y pageerror y hace fallar la prueba si aparece alguno.
 * - Empieza con almacenamiento limpio (cada prueba tiene su contexto; además se limpia
 *   localStorage en la primera carga, sin borrar lo que la prueba cree después).
 * - Service workers bloqueados por omisión (la prueba de PWA puede usar test.use({ serviceWorkers: "allow" })).
 */
export interface OpcionesE2E {
  /** Los recorridos ajenos a privacidad empiezan con el aviso ya leído. */
  avisoCookiesAtendido: boolean;
  /** Mensajes de consola tolerados en una prueba concreta (usar con moderación y explicar por qué). */
  erroresPermitidos: RegExp[];
}

interface FixturesE2E {
  erroresDeConsola: string[];
}

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "[::1]"]);

export const test = base.extend<FixturesE2E & OpcionesE2E>({
  serviceWorkers: "block",
  avisoCookiesAtendido: [true, { option: true }],
  erroresPermitidos: [[], { option: true }],
  erroresDeConsola: [
    async ({ page, erroresPermitidos, avisoCookiesAtendido }, use) => {
    const errores: string[] = [];
    const permitido = (texto: string) => erroresPermitidos.some((patron) => patron.test(texto));

    await page.context().route("**/*", async (ruta) => {
      const url = new URL(ruta.request().url());
      if (url.protocol === "data:" || url.protocol === "blob:" || HOSTS_LOCALES.has(url.hostname)) {
        await ruta.continue();
      } else {
        await ruta.abort("blockedbyclient");
      }
    });

    await page.addInitScript((avisoAtendido) => {
      try {
        if (!window.sessionStorage.getItem("__e2e_almacenamiento_limpio")) {
          window.localStorage.clear();
          if (avisoAtendido) window.localStorage.setItem("luum:aviso-cookies:v1", "leido");
          window.sessionStorage.setItem("__e2e_almacenamiento_limpio", "1");
        }
      } catch {
        // Almacenamiento bloqueado: la app usa memoria.
      }
    }, avisoCookiesAtendido);

    page.on("console", (mensaje) => {
      if (mensaje.type() !== "error") return;
      const texto = `console.error: ${mensaje.text()} (${mensaje.location().url ?? ""})`;
      if (!permitido(texto)) errores.push(texto);
    });
    page.on("pageerror", (error) => {
      const texto = `pageerror: ${error.message}`;
      if (!permitido(texto)) errores.push(texto);
    });

    await use(errores);

    expect(errores, "La página no debe emitir errores de consola ni excepciones").toEqual([]);
    },
    // Automática: se aplica a todas las pruebas aunque no pidan el fixture.
    { auto: true },
  ],
});

export { expect };
