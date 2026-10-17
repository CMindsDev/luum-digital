import { describe, expect, it } from "vitest";
import type { Reporte } from "@/types";
import { FILTRO_COLA, ordenarCola } from "./cola";

const AHORA = new Date("2026-10-17T12:00:00.000Z");
const DIA = 86_400_000;

function reporte(id: string, cambios: Partial<Reporte> = {}): Reporte {
  const creadoEn = cambios.creadoEn ?? new Date(AHORA.getTime() - DIA).toISOString();
  return {
    id,
    folio: `DEMO-R-${id.padStart(7, "0")}`,
    categoria: "basura_via_publica",
    descripcion: "Reporte de prueba para la cola del operador.",
    ubicacion: { lat: 20.97, lng: -89.62, referencia: "Calle 60 x 59 y 61", origen: "manual" },
    tieneFoto: false,
    riesgoDeclarado: false,
    identidadId: "vecina-01",
    creadoEn,
    actualizadoEn: creadoEn,
    estadoMunicipal: "registrado",
    verificacion: "no_aplica",
    historial: [],
    aportaciones: [],
    ...cambios,
  };
}

describe("ordenarCola (prioridad con criterios explícitos)", () => {
  it("sólo incluye reportes registrados o en proceso", () => {
    expect(FILTRO_COLA.estados).toEqual(["registrado", "en_proceso"]);
    const cola = ordenarCola(
      [reporte("1"), reporte("2", { estadoMunicipal: "en_proceso" }), reporte("3", { estadoMunicipal: "solucionado" }), reporte("4", { estadoMunicipal: "cancelado" })],
      AHORA,
    );
    expect(cola.map((e) => e.reporte.id).sort()).toEqual(["1", "2"]);
  });

  it("ordena por riesgo declarado, antigüedad y tipo, y a igual prioridad el más antiguo primero", () => {
    const riesgo = reporte("1", { riesgoDeclarado: true, categoria: "bache" });
    const antiguo = reporte("2", { creadoEn: new Date(AHORA.getTime() - 10 * DIA).toISOString() });
    const tipo = reporte("3", { categoria: "luminaria" });
    const reciente = reporte("4");
    const igualMasViejo = reporte("5", { creadoEn: new Date(AHORA.getTime() - 2 * DIA).toISOString() });
    const cola = ordenarCola([reciente, tipo, antiguo, igualMasViejo, riesgo], AHORA);
    expect(cola.map((e) => e.reporte.id)).toEqual(["1", "2", "3", "5", "4"]);
    expect(cola[0]?.prioridad.nivel).toBe("alta");
    expect(cola[0]?.prioridad.criterios.map((c) => c.id)).toEqual(["riesgo_declarado", "tipo"]);
  });

  it("nunca usa popularidad, aportaciones ni puntos de nadie", () => {
    const aportacion = { id: "a", identidadId: "ana", fecha: AHORA.toISOString(), descripcion: "Yo también lo vi.", tieneFoto: false };
    const popular = reporte("1", { aportaciones: Array.from({ length: 25 }, (_, i) => ({ ...aportacion, id: `a${i}` })), identidadId: "ana" });
    const discreto = reporte("2", { riesgoDeclarado: true, identidadId: "vecino-02" });
    const cola = ordenarCola([popular, discreto], AHORA);
    expect(cola.map((e) => e.reporte.id)).toEqual(["2", "1"]);
    // Las mismas entradas con y sin aportaciones producen la misma prioridad.
    const sinAportaciones = ordenarCola([{ ...popular, aportaciones: [] }], AHORA);
    expect(cola.find((e) => e.reporte.id === "1")?.prioridad).toEqual(sinAportaciones[0]?.prioridad);
  });
});
