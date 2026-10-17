import { describe, expect, it } from "vitest";
import { buscarPosiblesDuplicados, normalizarCalle } from "@/domain/duplicados";
import { crearReportesSemilla, IDS_SEMILLA } from "@/data/reportes-semilla";
import { componerReferencia, componerUbicacion, nombrarVia, type CamposUbicacion } from "./ubicacion";

const BASE: CamposUbicacion = {
  modoUbicacion: "manual",
  coloniaId: "centro",
  calle: "60",
  cruzamiento1: "59",
  cruzamiento2: "61",
  referenciaAdicional: "",
  referenciaMapa: "",
  lat: null,
  lng: null,
  origenCoordenadas: "mapa",
};

describe("ubicación del reporte", () => {
  it("escribe la referencia como en Mérida", () => {
    expect(componerReferencia(BASE)).toBe("Calle 60 x 59 y 61");
    expect(componerReferencia({ ...BASE, calle: "calle 60", cruzamiento1: "Calle 59", cruzamiento2: "", referenciaAdicional: "frente al parque" })).toBe(
      "Calle 60 x 59, frente al parque",
    );
    expect(nombrarVia("Avenida Itzáes")).toBe("Avenida Itzáes");
    expect(nombrarVia("  21-A ")).toBe("Calle 21-A");
  });

  it("la calle principal se reconoce para detectar duplicados", () => {
    expect(normalizarCalle(componerReferencia(BASE))).toBe("calle 60");
  });

  it("manual: usa el centroide aproximado de la colonia", () => {
    const ubicacion = componerUbicacion(BASE);
    expect(ubicacion).toMatchObject({ colonia: "Centro", origen: "manual", referencia: "Calle 60 x 59 y 61" });
    expect(ubicacion?.lat).toBeCloseTo(20.9671);
    expect(componerUbicacion({ ...BASE, coloniaId: "" })).toBeNull();
  });

  it("mapa o dispositivo: usa las coordenadas marcadas y la referencia escrita", () => {
    const campos: CamposUbicacion = { ...BASE, modoUbicacion: "mapa", coloniaId: "", lat: 20.97, lng: -89.62, referenciaMapa: " Frente al mercado ", origenCoordenadas: "dispositivo" };
    expect(componerUbicacion(campos)).toEqual({ lat: 20.97, lng: -89.62, referencia: "Frente al mercado", origen: "dispositivo" });
    expect(componerUbicacion({ ...campos, lat: null })).toBeNull();
  });

  it("el bache de Bruno en Centro, calle 60 aparece como posible duplicado de una ubicación manual", () => {
    const ahora = new Date("2026-10-17T12:00:00Z");
    const semillas = crearReportesSemilla(ahora);
    const ubicacion = componerUbicacion(BASE);
    if (!ubicacion) throw new Error("ubicación esperada");
    const duplicados = buscarPosiblesDuplicados({ categoria: "bache", ubicacion }, semillas, ahora);
    expect(duplicados.map((d) => d.reporte.id)).toContain(IDS_SEMILLA.bacheCentroBruno);
  });
});
