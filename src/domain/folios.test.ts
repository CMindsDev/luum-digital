import { describe, expect, it } from "vitest";
import {
  CONTADORES_INICIALES,
  esFolioDemo,
  extraerFolio,
  formatearFolio,
  normalizarFolio,
  referenciaApoyoSimulada,
  siguienteFolio,
  tipoDeFolio,
} from "./folios";

describe("folios DEMO", () => {
  it("formatea con prefijo DEMO y siete dígitos", () => {
    expect(formatearFolio("reporte", 12)).toBe("DEMO-R-0000012");
    expect(formatearFolio("gestion", 1)).toBe("DEMO-G-0000001");
    expect(formatearFolio("pago", 3)).toBe("DEMO-P-0000003");
    expect(formatearFolio("cita", 4)).toBe("DEMO-C-0000004");
    expect(formatearFolio("canje", 5)).toBe("DEMO-B-0000005");
  });

  it("rechaza números que no son enteros positivos", () => {
    expect(() => formatearFolio("reporte", 0)).toThrow(RangeError);
    expect(() => formatearFolio("reporte", 1.5)).toThrow(RangeError);
  });

  it("es monotónico: nunca reutiliza un folio y cada tipo lleva su propio contador", () => {
    let contadores = CONTADORES_INICIALES;
    const emitidos: string[] = [];
    for (let i = 0; i < 5; i += 1) {
      const resultado = siguienteFolio(contadores, "reporte", undefined);
      contadores = resultado.contadores;
      emitidos.push(resultado.folio);
    }
    expect(new Set(emitidos).size).toBe(5);
    expect(emitidos[0]).toBe("DEMO-R-0000001");
    expect(emitidos[4]).toBe("DEMO-R-0000005");
    expect(contadores.gestion).toBe(0);
    expect(siguienteFolio(contadores, "gestion", undefined).folio).toBe("DEMO-G-0000001");
  });

  it("salta los folios que ya existen", () => {
    const resultado = siguienteFolio(CONTADORES_INICIALES, "reporte", new Set(["DEMO-R-0000001", "DEMO-R-0000002"]));
    expect(resultado.folio).toBe("DEMO-R-0000003");
    expect(resultado.contadores.reporte).toBe(3);
  });

  it("normaliza lo que escribe la persona", () => {
    expect(normalizarFolio(" demo-r-12 ")).toBe("DEMO-R-0000012");
    expect(normalizarFolio("DEMO R 12")).toBe("DEMO-R-0000012");
    expect(normalizarFolio("demor0000012")).toBe("DEMO-R-0000012");
    expect(normalizarFolio("texto libre")).toBe("TEXTOLIBRE");
  });

  it("reconoce y clasifica folios DEMO", () => {
    expect(esFolioDemo("demo-g-3")).toBe(true);
    expect(esFolioDemo("1234567")).toBe(false);
    expect(tipoDeFolio("DEMO-R-0000001")).toBe("reporte");
    expect(tipoDeFolio("DEMO-B-0000001")).toBe("canje");
    expect(tipoDeFolio("DEMO-S-0000001")).toBe("apoyo");
    expect(tipoDeFolio("nada")).toBeNull();
  });

  it("extrae un folio de un texto libre y no inventa folios", () => {
    expect(extraerFolio("mi folio es demo-r-0000012, gracias")).toBe("DEMO-R-0000012");
    expect(extraerFolio("quiero consultar mi folio")).toBeNull();
  });

  it("la referencia de apoyo simulada lleva prefijo DEMO-S y no se repite", () => {
    const a = referenciaApoyoSimulada();
    const b = referenciaApoyoSimulada();
    expect(a).toMatch(/^DEMO-S-\d{7}$/);
    expect(a).not.toBe(b);
  });
});
