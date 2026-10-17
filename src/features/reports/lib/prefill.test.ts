import { describe, expect, it } from "vitest";
import { interpretarReferencia, resolverReporte, valoresIniciales, type ValoresReporte } from "./formulario";
import { leerPrefillReporte } from "./prefill";

describe("prefill del asistente", () => {
  it("acepta sólo un prefill de reporte válido con origen asistente", () => {
    expect(leerPrefillReporte(null)).toBeNull();
    expect(leerPrefillReporte({ prefill: { tipo: "tramite", servicioId: "x", origen: "asistente" } })).toBeNull();
    expect(leerPrefillReporte({ prefill: { tipo: "reporte", categoria: "ovni", origen: "asistente" } })).toBeNull();
    expect(leerPrefillReporte({ prefill: { tipo: "reporte", categoria: "bache", origen: "otro" } })).toBeNull();
    expect(
      leerPrefillReporte({ prefill: { tipo: "reporte", categoria: "bache", origen: "asistente", descripcion: "  Bache en la 60  ", referenciaUbicacion: 5 } }),
    ).toEqual({ tipo: "reporte", categoria: "bache", origen: "asistente", descripcion: "Bache en la 60" });
  });

  it("interpreta calle, cruzamientos y colonia de una referencia libre", () => {
    expect(interpretarReferencia("calle 60 x 59 y 61 del Centro")).toEqual({
      coloniaId: "centro",
      calle: "60",
      cruzamiento1: "59",
      cruzamiento2: "61",
      referenciaAdicional: "",
    });
    expect(interpretarReferencia("frente al parque de Itzimná")).toMatchObject({ coloniaId: "itzimna", calle: "", referenciaAdicional: "frente al parque de Itzimná" });
  });

  it("los valores iniciales llevan el texto del asistente para que la persona lo revise", () => {
    const valores = valoresIniciales("bache", { tipo: "reporte", categoria: "bache", origen: "asistente", descripcion: "Bache profundo en la esquina", referenciaUbicacion: "calle 60 del Centro" });
    expect(valores).toMatchObject({ paso: "descripcion", categoria: "bache", descripcion: "Bache profundo en la esquina", calle: "60", coloniaId: "centro" });
  });
});

describe("resolver por paso", () => {
  const base = valoresIniciales("bache", null);
  const resolver = (valores: ValoresReporte) =>
    resolverReporte(valores, undefined, { fields: {}, shouldUseNativeValidation: false, criteriaMode: "firstError", names: undefined });

  it("el paso de descripción sólo valida tipo y descripción", async () => {
    const resultado = await resolver({ ...base, descripcion: "corto" });
    expect(Object.keys(resultado.errors)).toEqual(["descripcion"]);
    const valido = await resolver({ ...base, descripcion: "Bache grande en el carril derecho de la calle" });
    expect(valido.errors).toEqual({});
  });

  it("el paso de ubicación exige colonia, calle y cruzamiento en modo manual", async () => {
    const resultado = await resolver({ ...base, paso: "ubicacion" });
    expect(Object.keys(resultado.errors).sort()).toEqual(["calle", "coloniaId", "cruzamiento1"]);
  });

  it("en modo mapa exige el punto dentro de Mérida y una referencia", async () => {
    const sinPunto = await resolver({ ...base, paso: "ubicacion", modoUbicacion: "mapa" });
    expect(sinPunto.errors.lat?.message).toBe("Marca el punto en el mapa o usa la ubicación de tu dispositivo.");
    expect(sinPunto.errors.referenciaMapa).toBeDefined();
    const fuera = await resolver({ ...base, paso: "ubicacion", modoUbicacion: "mapa", lat: 19.4, lng: -99.1, referenciaMapa: "Zócalo" });
    expect(fuera.errors.lat?.message).toBe("La ubicación está fuera del municipio de Mérida.");
  });

  it("los pasos sin campos no bloquean", async () => {
    expect((await resolver({ ...base, paso: "foto" })).errors).toEqual({});
  });
});
