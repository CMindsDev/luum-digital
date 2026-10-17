import { describe, expect, it } from "vitest";
import { rutaDeFolio } from "./folio";

describe("rutaDeFolio", () => {
  it("lleva los reportes a «Mis reportes» con el folio normalizado", () => {
    expect(rutaDeFolio(" demo-r-12 ")).toEqual({
      ok: true,
      folio: "DEMO-R-0000012",
      ruta: "/reportes/mis-reportes?folio=DEMO-R-0000012",
      destino: "Mis reportes",
    });
  });

  it("lleva gestiones, pagos y citas a «Mis gestiones»", () => {
    for (const folio of ["DEMO-G-0000001", "DEMO-P-0000003", "DEMO-C-0000004"]) {
      const resultado = rutaDeFolio(folio);
      expect(resultado.ok && resultado.ruta).toBe(`/gestiones?folio=${folio}`);
    }
  });

  it("lleva los canjes a recompensas", () => {
    const resultado = rutaDeFolio("DEMO-B-0000002");
    expect(resultado.ok && resultado.ruta).toBe("/participacion/recompensas?folio=DEMO-B-0000002");
  });

  it("rechaza lo vacío y lo que no es un folio de demostración", () => {
    expect(rutaDeFolio("   ").ok).toBe(false);
    expect(rutaDeFolio("ABC-123").ok).toBe(false);
    expect(rutaDeFolio("12345").ok).toBe(false);
  });

  it("no consulta solicitudes de apoyo de bienestar (sólo viven en memoria)", () => {
    const resultado = rutaDeFolio("DEMO-S-0000001");
    expect(resultado.ok).toBe(false);
  });
});
