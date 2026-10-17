import { describe, expect, it } from "vitest";
import type { Reporte, ResultadoVerificacion, Verificacion } from "@/types";
import { REGLAS_PUNTOS_DEMO } from "@/data/reglas-puntos";
import {
  calcularPuntosVerificacion,
  claveEventoVerificacion,
  criteriosCumplidos,
  estadoVerificacionAgregado,
  evaluarCalidad,
  evaluarElegibilidad,
} from "./verificacion";

type ReporteMinimo = Pick<Reporte, "id" | "estadoMunicipal" | "identidadId">;

const solucionado: ReporteMinimo = { id: "rep-1", estadoMunicipal: "solucionado", identidadId: "ana" };

function verif(sobrescribir: Partial<Verificacion> = {}): Pick<Verificacion, "reporteId" | "identidadId" | "estadoRevision" | "resultado"> {
  return { reporteId: "rep-1", identidadId: "bruno", estadoRevision: "aprobada", resultado: "reparacion_completada", ...sobrescribir };
}

describe("elegibilidad para verificar", () => {
  it("nadie puede verificar su propio reporte (no hay recompensa por autoverificarse)", () => {
    const resultado = evaluarElegibilidad(solucionado, "ana", []);
    expect(resultado).toMatchObject({ elegible: false, codigo: "reporte_propio" });
  });

  it("sólo se verifica un reporte con atención reportada", () => {
    for (const estado of ["registrado", "en_proceso", "cancelado"] as const) {
      expect(evaluarElegibilidad({ ...solucionado, estadoMunicipal: estado }, "bruno", [])).toMatchObject({
        elegible: false,
        codigo: "no_solucionado",
      });
    }
  });

  it("una sola verificación por persona y reporte", () => {
    expect(evaluarElegibilidad(solucionado, "bruno", [verif()])).toMatchObject({ elegible: false, codigo: "ya_verificado" });
    // Otra persona sí puede verificar; y la misma persona puede verificar otro reporte.
    expect(evaluarElegibilidad(solucionado, "carla", [verif()])).toEqual({ elegible: true });
    expect(evaluarElegibilidad(solucionado, "bruno", [verif({ reporteId: "rep-2" })])).toEqual({ elegible: true });
  });
});

describe("calidad y puntos de una verificación", () => {
  const reglas = REGLAS_PUNTOS_DEMO;

  it("mide la calidad por comentario útil, ubicación confirmada y evidencia", () => {
    const completa = evaluarCalidad({ comentario: "El bache sigue ahí y el hueco se ve más grande", ubicacionConfirmada: true, tieneFoto: true }, reglas);
    expect(criteriosCumplidos(completa)).toBe(3);
    const corta = evaluarCalidad({ comentario: "ya", ubicacionConfirmada: false, tieneFoto: false }, reglas);
    expect(criteriosCumplidos(corta)).toBe(0);
    expect(evaluarCalidad({ comentario: "x".repeat(reglas.longitudMinimaComentario), ubicacionConfirmada: false, tieneFoto: false }, reglas).descripcionUtil).toBe(true);
    expect(evaluarCalidad({ comentario: "x".repeat(reglas.longitudMinimaComentario - 1), ubicacionConfirmada: false, tieneFoto: false }, reglas).descripcionUtil).toBe(false);
  });

  it("se premia la calidad, NO la respuesta positiva: «completada» y «persiste» valen igual", () => {
    for (const calidad of [
      { descripcionUtil: true, ubicacionConfirmada: true, evidencia: true },
      { descripcionUtil: true, ubicacionConfirmada: false, evidencia: false },
      { descripcionUtil: false, ubicacionConfirmada: false, evidencia: false },
    ]) {
      const completada = calcularPuntosVerificacion("reparacion_completada", calidad, reglas);
      const persiste = calcularPuntosVerificacion("problema_persiste", calidad, reglas);
      expect(persiste).toBe(completada);
    }
  });

  it("más calidad da más puntos con la misma respuesta", () => {
    const base = calcularPuntosVerificacion("problema_persiste", { descripcionUtil: false, ubicacionConfirmada: false, evidencia: false }, reglas);
    const maximo = calcularPuntosVerificacion("problema_persiste", { descripcionUtil: true, ubicacionConfirmada: true, evidencia: true }, reglas);
    expect(base).toBe(reglas.verificacionBase);
    expect(maximo).toBe(reglas.verificacionBase + 3 * reglas.verificacionBonoCalidad);
  });

  it("«No puedo comprobarlo» vale lo que dice la regla, sin depender de la calidad", () => {
    const resultado: ResultadoVerificacion = "no_puedo_comprobar";
    expect(calcularPuntosVerificacion(resultado, { descripcionUtil: true, ubicacionConfirmada: true, evidencia: true }, reglas)).toBe(reglas.verificacionNoConcluyente);
    expect(calcularPuntosVerificacion(resultado, { descripcionUtil: false, ubicacionConfirmada: false, evidencia: false }, reglas)).toBe(reglas.verificacionNoConcluyente);
  });

  it("la clave de evento es estable (base de la idempotencia)", () => {
    expect(claveEventoVerificacion("ver-1")).toBe("verificacion:ver-1:aprobada");
  });
});

describe("estado agregado de la verificación ciudadana", () => {
  it("no aplica mientras no haya atención reportada", () => {
    expect(estadoVerificacionAgregado({ id: "rep-1", estadoMunicipal: "en_proceso" }, [verif()])).toBe("no_aplica");
  });

  it("está pendiente si nadie verificó o si las verificaciones aún no se aprueban", () => {
    expect(estadoVerificacionAgregado(solucionado, [])).toBe("pendiente");
    expect(estadoVerificacionAgregado(solucionado, [verif({ estadoRevision: "pendiente_revision" })])).toBe("pendiente");
    expect(estadoVerificacionAgregado(solucionado, [verif({ estadoRevision: "rechazada" }), verif({ estadoRevision: "revertida" })])).toBe("pendiente");
  });

  it("coincide cuando una verificación aprobada dice que se reparó", () => {
    expect(estadoVerificacionAgregado(solucionado, [verif()])).toBe("coincide");
  });

  it("hay discrepancia si una verificación aprobada dice que el problema persiste (aunque otra diga lo contrario)", () => {
    expect(estadoVerificacionAgregado(solucionado, [verif({ resultado: "problema_persiste" })])).toBe("discrepancia");
    expect(estadoVerificacionAgregado(solucionado, [verif(), verif({ identidadId: "carla", resultado: "problema_persiste" })])).toBe("discrepancia");
  });

  it("no es concluyente si sólo hay verificaciones aprobadas que no pudieron comprobarlo", () => {
    expect(estadoVerificacionAgregado(solucionado, [verif({ resultado: "no_puedo_comprobar" })])).toBe("no_concluyente");
  });

  it("ignora verificaciones de otros reportes", () => {
    expect(estadoVerificacionAgregado(solucionado, [verif({ reporteId: "rep-9", resultado: "problema_persiste" })])).toBe("pendiente");
  });
});
