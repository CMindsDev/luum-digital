import { describe, expect, it } from "vitest";
import { ZONAS_DEMANDA_FICTICIA, LEYENDA_DEMANDA_BIENESTAR, UMBRAL_DEMANDA_BIENESTAR, RESOLUCION_DEMANDA_BIENESTAR } from "@/data/demanda-bienestar";
import { agregarEnCeldas, aplicarUmbral, construirDemandaAgregada, UMBRAL_MINIMO_DEMANDA } from "./demanda";

describe("demanda agregada en celdas H3", () => {
  it("agrupa puntos cercanos en la misma celda y suma sus conteos", () => {
    const puntos = [
      { lat: 20.9674, lng: -89.6243 },
      { lat: 20.9675, lng: -89.6244, conteo: 4 },
      { lat: 21.04, lng: -89.55 },
    ];
    const celdas = agregarEnCeldas(puntos, 7);
    expect(celdas).toHaveLength(2);
    expect(celdas[0]?.conteo).toBe(5);
    expect(celdas.every((c) => c.resolucion === 7 && c.h3.length > 0)).toBe(true);
  });

  it("oculta las celdas por debajo del umbral y sólo informa cuántas se ocultaron", () => {
    const { visibles, ocultas } = aplicarUmbral(
      [
        { h3: "a", conteo: 12, resolucion: 7 },
        { h3: "b", conteo: 10, resolucion: 7 },
        { h3: "c", conteo: 9, resolucion: 7 },
        { h3: "d", conteo: 1, resolucion: 7 },
      ],
      10,
    );
    expect(visibles.map((c) => c.h3)).toEqual(["a", "b"]);
    expect(ocultas).toBe(2);
  });

  it("el umbral por omisión protege a quien aparece en celdas pequeñas", () => {
    expect(UMBRAL_MINIMO_DEMANDA).toBeGreaterThanOrEqual(10);
    const demanda = construirDemandaAgregada([{ lat: 20.9, lng: -89.6, conteo: UMBRAL_MINIMO_DEMANDA - 1 }], { leyenda: "x" });
    expect(demanda.celdas).toHaveLength(0);
    expect(demanda.celdasOcultas).toBe(1);
  });

  it("los datos ficticios de bienestar muestran celdas grandes y ocultan las pequeñas, con su leyenda", () => {
    const demanda = construirDemandaAgregada(ZONAS_DEMANDA_FICTICIA, {
      resolucion: RESOLUCION_DEMANDA_BIENESTAR,
      umbralMinimo: UMBRAL_DEMANDA_BIENESTAR,
      leyenda: LEYENDA_DEMANDA_BIENESTAR,
    });
    expect(demanda.celdas.length).toBeGreaterThan(0);
    expect(demanda.celdasOcultas).toBeGreaterThan(0);
    expect(demanda.celdas.every((c) => c.conteo >= UMBRAL_DEMANDA_BIENESTAR)).toBe(true);
    expect(demanda.leyenda).toMatch(/ficticios/i);
    expect(demanda.leyenda).toMatch(/no provienen de conversaciones/i);
  });
});
