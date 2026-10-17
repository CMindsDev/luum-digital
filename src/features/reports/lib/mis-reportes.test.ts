import { describe, expect, it } from "vitest";
import { crearReportesSemilla } from "@/data/reportes-semilla";
import { aFiltroReportes, agruparPorEstado, contarPorEstado, escribirFiltros, filtroFechasSchema, leerFiltros, ORDEN_ESTADOS } from "./mis-reportes";

describe("Mis reportes", () => {
  const reportes = crearReportesSemilla(new Date("2026-10-17T12:00:00Z"));

  it("agrupa por estatus en el orden de Mérida Móvil", () => {
    expect(ORDEN_ESTADOS).toEqual(["registrado", "en_proceso", "solucionado", "cancelado"]);
    const grupos = agruparPorEstado(reportes);
    const conteo = contarPorEstado(reportes);
    expect(conteo.registrado + conteo.en_proceso + conteo.solucionado + conteo.cancelado).toBe(reportes.length);
    expect(grupos.cancelado.every((r) => r.estadoMunicipal === "cancelado")).toBe(true);
  });

  it("lee y escribe los filtros de la URL, ignorando fechas inválidas", () => {
    const filtros = leerFiltros(new URLSearchParams("desde=2026-10-01&hasta=ayer&folio=%20DEMO-R-1%20"));
    expect(filtros).toEqual({ desde: "2026-10-01", hasta: "", folio: "DEMO-R-1" });
    expect(escribirFiltros(filtros).toString()).toBe("desde=2026-10-01&folio=DEMO-R-1");
    expect(aFiltroReportes(filtros, "ana")).toEqual({ identidadId: "ana", desde: "2026-10-01", folio: "DEMO-R-1" });
  });

  it("la fecha fin no puede ser anterior a la fecha inicio", () => {
    expect(filtroFechasSchema.safeParse({ desde: "2026-10-10", hasta: "2026-10-01" }).success).toBe(false);
    expect(filtroFechasSchema.safeParse({ desde: "2026-10-01", hasta: "2026-10-10" }).success).toBe(true);
    expect(filtroFechasSchema.safeParse({ desde: "", hasta: "" }).success).toBe(true);
  });
});
