import { describe, expect, it } from "vitest";
import { etiquetaDeModo } from "./etiqueta-modo";

describe("etiquetaDeModo", () => {
  it("el modo de demostración siempre se rotula como respuestas programadas, aunque esté «listo»", () => {
    for (const estado of ["inactivo", "conectando", "listo", "pensando", "cerrado"] as const) {
      expect(etiquetaDeModo("demo", estado)).toEqual({ texto: "Respuestas programadas (demostración)", tono: "demo" });
    }
  });

  it("sólo dice «Conectado a OpenAI Realtime» con la sesión real abierta", () => {
    expect(etiquetaDeModo("realtime", "listo").texto).toBe("Conectado a OpenAI Realtime");
    expect(etiquetaDeModo("realtime", "hablando").texto).toBe("Conectado a OpenAI Realtime");
    expect(etiquetaDeModo("realtime", "conectando").texto).toBe("Conectando con OpenAI Realtime…");
    expect(etiquetaDeModo("realtime", "inactivo").texto).toBe("OpenAI Realtime (sin conectar)");
    expect(etiquetaDeModo("realtime", "cerrado").texto).not.toMatch(/^Conectado/);
  });
});
