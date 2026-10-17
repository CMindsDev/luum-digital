import { describe, expect, it } from "vitest";
import { LINEAS_AYUDA } from "@/data/bienestar";
import type { LineaAyuda } from "@/types";
import { agruparLineas, esEmergencias911, hrefTelefono, ordenarLineas } from "./lineas";

const ids = (lineas: readonly LineaAyuda[]) => lineas.map((linea) => linea.id);

describe("líneas de ayuda", () => {
  it("pone el 911 primero en cualquier enfoque", () => {
    for (const enfoque of ["general", "salud_mental", "violencia"] as const) {
      expect(ordenarLineas(LINEAS_AYUDA, enfoque)[0]?.telefonoMarcable).toBe("911");
    }
  });

  it("en salud mental, Línea de la Vida y Alma Nova van antes que Línea Mujer", () => {
    const { apoyo } = agruparLineas(LINEAS_AYUDA, "salud_mental");
    expect(ids(apoyo)).toEqual(["linea-de-la-vida", "apoyo-psicologico-alma-nova", "linea-mujer"]);
  });

  it("en violencia, Línea Mujer va justo después del 911", () => {
    expect(ids(ordenarLineas(LINEAS_AYUDA, "violencia")).slice(0, 2)).toEqual(["emergencias-911", "linea-mujer"]);
  });

  it("separa otros contactos municipales (orientación y protección civil) de las líneas de apoyo", () => {
    const { otras, emergencias } = agruparLineas(LINEAS_AYUDA);
    expect(ids(emergencias)).toEqual(["emergencias-911"]);
    expect(ids(otras)).toEqual(["ayuntatel", "proteccion-civil"]);
  });

  it("no altera el arreglo original y reconoce el 911 aunque tenga espacios", () => {
    const copia = [...LINEAS_AYUDA];
    ordenarLineas(LINEAS_AYUDA, "violencia");
    expect(LINEAS_AYUDA).toEqual(copia);
    expect(esEmergencias911({ telefonoMarcable: " 9 1 1 " })).toBe(true);
  });

  it("arma enlaces tel: sólo con dígitos, «+» y comas", () => {
    expect(hrefTelefono("800 455 76 72")).toBe("tel:8004557672");
    expect(hrefTelefono("911")).toBe("tel:911");
    expect(hrefTelefono("+52 999 942-00-00,123")).toBe("tel:+529999420000,123");
  });
});
