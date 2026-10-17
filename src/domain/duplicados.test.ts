import { describe, expect, it } from "vitest";
import { cancelarReporte, registrarAtencion, validarReporte } from "./reportes";
import { CENTRO, reporteDemo } from "@/test/fixtures";
import {
  buscarPosiblesDuplicados,
  distanciaMetros,
  normalizarCalle,
  normalizarColonia,
  RADIO_DUPLICADO_METROS,
  VENTANA_DUPLICADO_DIAS,
} from "./duplicados";

const AHORA = new Date("2026-10-20T12:00:00.000Z");
const FECHA = "2026-10-17T12:00:00.000Z";

/** ~1 m en grados de latitud. */
const METRO = 1 / 111_320;

function desplazado(metrosNorte: number) {
  return { lat: CENTRO.lat + metrosNorte * METRO, lng: CENTRO.lng };
}

const consulta = (sobrescribir: Partial<{ categoria: "bache" | "luminaria"; lat: number; lng: number; referencia: string; colonia: string }> = {}) => ({
  categoria: sobrescribir.categoria ?? ("bache" as const),
  ubicacion: {
    lat: sobrescribir.lat ?? CENTRO.lat,
    lng: sobrescribir.lng ?? CENTRO.lng,
    referencia: sobrescribir.referencia ?? "Calle 60 x 59 y 61",
    colonia: sobrescribir.colonia ?? "Centro",
  },
});

describe("posibles duplicados", () => {
  it("mide distancias en metros (haversine)", () => {
    expect(distanciaMetros(CENTRO, CENTRO)).toBe(0);
    expect(distanciaMetros(CENTRO, desplazado(100))).toBeGreaterThan(98);
    expect(distanciaMetros(CENTRO, desplazado(100))).toBeLessThan(102);
  });

  it("encuentra un reporte abierto del mismo tipo dentro del radio, con motivo legible", () => {
    const existente = reporteDemo({}, { id: "rep-1" });
    const resultado = buscarPosiblesDuplicados(consulta({ ...desplazado(30), referencia: "Av. Itzáes", colonia: "Otra" }), [existente], AHORA);
    expect(resultado).toHaveLength(1);
    expect(resultado[0]?.reporte.id).toBe("rep-1");
    expect(resultado[0]?.distanciaMetros).toBeLessThanOrEqual(RADIO_DUPLICADO_METROS);
    expect(resultado[0]?.motivo.length).toBeGreaterThan(5);
  });

  it("no marca como duplicado un reporte de otro tipo ni uno lejano de otra calle y colonia", () => {
    const existente = reporteDemo({}, { id: "rep-1" });
    expect(buscarPosiblesDuplicados(consulta({ categoria: "luminaria" }), [existente], AHORA)).toHaveLength(0);
    expect(
      buscarPosiblesDuplicados(consulta({ ...desplazado(500), referencia: "Calle 30 x 41 y 43", colonia: "García Ginerés" }), [existente], AHORA),
    ).toHaveLength(0);
  });

  it("detecta la misma calle y colonia aunque el punto esté fuera del radio", () => {
    const existente = reporteDemo({}, { id: "rep-1" });
    const resultado = buscarPosiblesDuplicados(consulta({ ...desplazado(150), referencia: "CALLE 60 por 55 y 57", colonia: "Col. Centro" }), [existente], AHORA);
    expect(resultado.map((r) => r.reporte.id)).toEqual(["rep-1"]);
  });

  it("ignora reportes cerrados (solucionados o cancelados)", () => {
    const base = reporteDemo({}, { id: "rep-1" });
    const solucionado = registrarAtencion(validarReporte(base, FECHA), "", FECHA);
    const cancelado = cancelarReporte(reporteDemo({}, { id: "rep-2" }), "no_procede", FECHA);
    expect(buscarPosiblesDuplicados(consulta(), [solucionado, cancelado], AHORA)).toHaveLength(0);
  });

  it("ignora reportes fuera de la ventana de tiempo", () => {
    const viejo = reporteDemo({}, { id: "rep-viejo", fecha: new Date(AHORA.getTime() - (VENTANA_DUPLICADO_DIAS + 1) * 86_400_000).toISOString() });
    expect(buscarPosiblesDuplicados(consulta(), [viejo], AHORA)).toHaveLength(0);
  });

  it("ordena los más cercanos primero", () => {
    const cerca = reporteDemo({ ubicacion: { ...desplazado(10), referencia: "Calle 60 x 59 y 61", origen: "manual" } }, { id: "cerca" });
    const lejos = reporteDemo({ ubicacion: { ...desplazado(50), referencia: "Calle 60 x 59 y 61", origen: "manual" } }, { id: "lejos" });
    const resultado = buscarPosiblesDuplicados(consulta(), [lejos, cerca], AHORA);
    expect(resultado.map((r) => r.reporte.id)).toEqual(["cerca", "lejos"]);
  });

  it("normaliza calles y colonias (mayúsculas, acentos, abreviaturas y cruzamientos)", () => {
    expect(normalizarCalle("Calle 60 x 59 y 61")).toBe("calle 60");
    expect(normalizarCalle("C. 60 por 59 y 61")).toBe("calle 60");
    expect(normalizarCalle(undefined)).toBe("");
    expect(normalizarColonia("Col. García Ginerés")).toBe("garcia gineres");
    expect(normalizarColonia("Fracc. Pensiones")).toBe("pensiones");
    expect(normalizarColonia(undefined)).toBe("");
  });
});
