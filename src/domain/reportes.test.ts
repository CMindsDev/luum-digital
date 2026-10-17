import { describe, expect, it } from "vitest";
import { ReglaDeNegocioError } from "@/services/contracts";
import { reporteDemo } from "@/test/fixtures";
import type { Reporte } from "@/types";
import {
  agregarAportacion,
  cancelarReporte,
  CATEGORIAS_REPORTE,
  esCategoriaReporte,
  estaAbierto,
  motivoPuntosCancelacion,
  NOMBRE_CATEGORIA_REPORTE,
  ordenarPorFecha,
  puedeTransicionar,
  registrarAtencion,
  validarReporte,
} from "./reportes";

const FECHA_2 = "2026-10-18T12:00:00.000Z";

function nuevo(): Reporte {
  return reporteDemo();
}

describe("reportes", () => {
  it("crea un reporte «registrado» con historial y sin verificación ciudadana", () => {
    const reporte = nuevo();
    expect(reporte.estadoMunicipal).toBe("registrado");
    expect(reporte.verificacion).toBe("no_aplica");
    expect(reporte.descripcion).toBe("Bache grande en el carril derecho, frente a la tienda.");
    expect(reporte.ubicacion.referencia).toBe("Calle 60 x 59 y 61");
    expect(reporte.historial).toHaveLength(1);
    expect(reporte.historial[0]?.tipo).toBe("creado");
    expect(reporte.folio).toMatch(/^DEMO-R-/);
  });

  it("recorre registrado → en proceso → solucionado y abre la verificación ciudadana", () => {
    const enProceso = validarReporte(nuevo(), FECHA_2);
    expect(enProceso.estadoMunicipal).toBe("en_proceso");
    const solucionado = registrarAtencion(enProceso, " Se rellenó el bache ", FECHA_2);
    expect(solucionado.estadoMunicipal).toBe("solucionado");
    // El estado municipal y la verificación ciudadana son ejes distintos.
    expect(solucionado.verificacion).toBe("pendiente");
    expect(solucionado.historial.map((e) => e.tipo)).toEqual(["creado", "validado", "atencion_registrada"]);
    expect(solucionado.historial.at(-1)?.descripcion).toContain("Se rellenó el bache");
  });

  it("rechaza transiciones inválidas con una regla de negocio legible", () => {
    const reporte = nuevo();
    expect(() => registrarAtencion(reporte, "nota", FECHA_2)).toThrow(ReglaDeNegocioError);
    const solucionado = registrarAtencion(validarReporte(reporte, FECHA_2), "", FECHA_2);
    expect(() => validarReporte(solucionado, FECHA_2)).toThrow(ReglaDeNegocioError);
    expect(() => cancelarReporte(solucionado, "no_procede", FECHA_2)).toThrow(ReglaDeNegocioError);
  });

  it("repetir la validación no es posible (no hay segunda transición)", () => {
    const enProceso = validarReporte(nuevo(), FECHA_2);
    expect(() => validarReporte(enProceso, FECHA_2)).toThrow(
      expect.objectContaining({ codigo: "transicion_invalida" }),
    );
  });

  it("cancela con motivo desde registrado o en proceso", () => {
    const cancelado = cancelarReporte(nuevo(), "duplicado", FECHA_2);
    expect(cancelado).toMatchObject({ estadoMunicipal: "cancelado", motivoCancelacion: "duplicado", verificacion: "no_aplica" });
    expect(cancelarReporte(validarReporte(nuevo(), FECHA_2), "no_procede", FECHA_2).estadoMunicipal).toBe("cancelado");
    expect(motivoPuntosCancelacion({ folio: "DEMO-R-0000001" }, "duplicado")).toBe("Reporte cancelado: Duplicado (DEMO-R-0000001)");
  });

  it("aportar información al mismo incidente no crea reporte ni cambia su estado", () => {
    const reporte = nuevo();
    const conAporte = agregarAportacion(reporte, { id: "apo-1", identidadId: "bruno", fecha: FECHA_2, descripcion: "El bache sigue creciendo", tieneFoto: false });
    expect(conAporte.id).toBe(reporte.id);
    expect(conAporte.estadoMunicipal).toBe("registrado");
    expect(conAporte.aportaciones).toHaveLength(1);
    expect(reporte.aportaciones).toHaveLength(0);
  });

  it("no admite aportaciones en reportes cerrados", () => {
    const solucionado = registrarAtencion(validarReporte(nuevo(), FECHA_2), "", FECHA_2);
    expect(estaAbierto(solucionado)).toBe(false);
    expect(() => agregarAportacion(solucionado, { id: "a", identidadId: "bruno", fecha: FECHA_2, descripcion: "x", tieneFoto: false })).toThrow(
      expect.objectContaining({ codigo: "reporte_cerrado" }),
    );
  });

  it("las transiciones permitidas son exactamente las del flujo municipal", () => {
    expect(puedeTransicionar("registrado", "en_proceso")).toBe(true);
    expect(puedeTransicionar("registrado", "solucionado")).toBe(false);
    expect(puedeTransicionar("en_proceso", "solucionado")).toBe(true);
    expect(puedeTransicionar("solucionado", "en_proceso")).toBe(false);
    expect(puedeTransicionar("cancelado", "registrado")).toBe(false);
  });

  it("usa los nombres de reporte de Mérida Móvil y reconoce sólo categorías válidas", () => {
    expect(CATEGORIAS_REPORTE).toHaveLength(7);
    expect(NOMBRE_CATEGORIA_REPORTE.bache).toBe("Bache");
    expect(NOMBRE_CATEGORIA_REPORTE.luminaria).toBe("Luminaria");
    expect(NOMBRE_CATEGORIA_REPORTE.desazolve_rejilla).toBe("Desazolve de rejilla");
    expect(NOMBRE_CATEGORIA_REPORTE.parques_jardines).toBe("Limpieza de parques y jardines");
    expect(NOMBRE_CATEGORIA_REPORTE.recoleccion_basura).toBe("Queja por falta de recolección de basura");
    expect(esCategoriaReporte("bache")).toBe(true);
    expect(esCategoriaReporte("alumbrado")).toBe(false);
  });

  it("ordena del más reciente al más antiguo sin mutar la lista", () => {
    const a = { creadoEn: "2026-10-01T00:00:00.000Z", id: "a" };
    const b = { creadoEn: "2026-10-05T00:00:00.000Z", id: "b" };
    const lista = [a, b];
    expect(ordenarPorFecha(lista).map((x) => x.id)).toEqual(["b", "a"]);
    expect(lista.map((x) => x.id)).toEqual(["a", "b"]);
  });
});
