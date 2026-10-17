import { afterEach, describe, expect, it } from "vitest";
import { cambiarIdioma, i18n, idiomaGuardado, msg } from "./index";

const ARCHIVOS = import.meta.glob<Record<string, unknown>>("./locales/yua/*.json", { eager: true, import: "default" });
const marcadores = (texto: string) => [...texto.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort().join(",");

afterEach(async () => {
  await cambiarIdioma("es");
});

describe("i18n", () => {
  it("en español devuelve el texto tal cual, también con interpolación", () => {
    expect(i18n.t("Buscar")).toBe("Buscar");
    expect(i18n.t("Tienes {{n}} reportes", { n: 3 })).toBe("Tienes 3 reportes");
    expect(msg("Inicio")).toBe("Inicio");
  });

  it("al cambiar a maya usa la traducción y cae al español si falta; recuerda la elección y ajusta lang", async () => {
    await cambiarIdioma("yua");
    expect(document.documentElement.lang).toBe("yua");
    expect(idiomaGuardado()).toBe("yua");
    expect(i18n.t("Buscar")).not.toBe("Buscar");
    expect(i18n.t("Texto que nadie ha traducido todavía")).toBe("Texto que nadie ha traducido todavía");
    await cambiarIdioma("es");
    expect(document.documentElement.lang).toBe("es-MX");
    expect(idiomaGuardado()).toBe("es");
  });
});

describe("traducciones al maya (src/i18n/locales/yua)", () => {
  it("son JSON de cadenas y conservan los {{marcadores}} de cada clave", () => {
    expect(Object.keys(ARCHIVOS).length).toBeGreaterThan(0);
    for (const [nombre, datos] of Object.entries(ARCHIVOS)) {
      for (const [clave, valor] of Object.entries(datos)) {
        expect(typeof valor, `${nombre}: «${clave}»`).toBe("string");
        if (String(valor).trim()) expect(marcadores(String(valor)), `${nombre}: «${clave}»`).toBe(marcadores(clave));
      }
    }
  });
});
