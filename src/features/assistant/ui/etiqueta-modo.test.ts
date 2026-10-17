import { describe, expect, it } from "vitest";
import { etiquetaDeModo } from "./etiqueta-modo";

describe("etiquetaDeModo", () => {
  it("fuera de la conexión no muestra una etiqueta extra", () => {
    for (const estado of ["inactivo", "conectando", "listo", "pensando", "cerrado"] as const) {
      expect(etiquetaDeModo("demo", estado)).toEqual({ texto: estado === "conectando" ? "Conectando…" : "", tono: estado === "conectando" ? "pendiente" : "demo" });
    }
  });

  it("solo conserva un aviso humano al conectar", () => {
    expect(etiquetaDeModo("realtime", "conectando")).toEqual({ texto: "Conectando…", tono: "pendiente" });
    expect(etiquetaDeModo("realtime", "listo")).toEqual({ texto: "", tono: "real" });
    expect(etiquetaDeModo("realtime", "hablando")).toEqual({ texto: "", tono: "real" });
    expect(etiquetaDeModo("realtime", "inactivo")).toEqual({ texto: "", tono: "real" });
  });
});
