import { describe, expect, it } from "vitest";
import type { CategoriaReporte } from "@/types";
import { AVISO_PRIORIDAD, calcularPrioridad } from "./prioridad";

const AHORA = new Date("2026-10-20T12:00:00.000Z");
const hace = (dias: number) => new Date(AHORA.getTime() - dias * 86_400_000).toISOString();

describe("prioridad con criterios explícitos", () => {
  it("el riesgo declarado, la antigüedad y el tipo suben la prioridad", () => {
    const baja = calcularPrioridad({ categoria: "basura_via_publica", riesgoDeclarado: false, creadoEn: hace(0) }, AHORA);
    const alta = calcularPrioridad({ categoria: "bache", riesgoDeclarado: true, creadoEn: hace(10) }, AHORA);
    expect(baja.nivel).toBe("baja");
    expect(alta.nivel).toBe("alta");
    expect(alta.puntaje).toBeGreaterThan(baja.puntaje);
    expect(alta.criterios.map((c) => c.id).sort()).toEqual(["antiguedad", "riesgo_declarado", "tipo"]);
  });

  it("cada criterio explica su peso y la suma coincide con el puntaje", () => {
    const resultado = calcularPrioridad({ categoria: "luminaria", riesgoDeclarado: true, creadoEn: hace(4) }, AHORA);
    expect(resultado.criterios.every((c) => c.descripcion.length > 0 && c.peso > 0)).toBe(true);
    expect(resultado.criterios.reduce((s, c) => s + c.peso, 0)).toBe(resultado.puntaje);
  });

  it("nunca depende de cuántas personas reportan ni de puntos: la función sólo recibe tipo, riesgo y fecha", () => {
    const entrada = { categoria: "bache" as CategoriaReporte, riesgoDeclarado: false, creadoEn: hace(1) };
    // Mismas entradas, mismo resultado, sin importar qué otros datos existan alrededor.
    expect(calcularPrioridad(entrada, AHORA)).toEqual(calcularPrioridad({ ...entrada }, AHORA));
    expect(calcularPrioridad.length).toBe(2);
    expect(AVISO_PRIORIDAD).toMatch(/no depende de cuántas personas reportan ni de puntos/i);
  });

  it("incluye siempre el aviso de que es una prioridad de demostración", () => {
    expect(calcularPrioridad({ categoria: "bache", riesgoDeclarado: false, creadoEn: hace(0) }, AHORA).aviso).toBe(AVISO_PRIORIDAD);
  });
});
