import { describe, expect, it } from "vitest";
import { ReglaDeNegocioError } from "@/services/contracts";
import type { MovimientoPuntos } from "@/types";
import {
  anularPorReferencia,
  aprobarCredito,
  calcularSaldo,
  cancelarCredito,
  movimientosDe,
  registrarCanje,
  registrarCredito,
  revertirCredito,
  totalesLibro,
  type LibroMayor,
  type NuevoCredito,
} from "./puntos";

const FECHA = "2026-10-17T12:00:00.000Z";
const FECHA_2 = "2026-10-18T12:00:00.000Z";

function credito(sobrescribir: Partial<NuevoCredito> = {}): NuevoCredito {
  return {
    id: "mov-1",
    identidadId: "ana",
    claveEvento: "reporte:rep-1:validado",
    tipo: "reporte_validado",
    puntos: 40,
    motivo: "Reporte DEMO-R-0000001 (pendiente de validación)",
    fecha: FECHA,
    estado: "pendiente",
    referenciaId: "rep-1",
    ...sobrescribir,
  };
}

function conLibro(...creditos: NuevoCredito[]): MovimientoPuntos[] {
  let libro: LibroMayor = [];
  for (const c of creditos) libro = registrarCredito(libro, c).libro;
  return [...libro];
}

describe("libro mayor de puntos", () => {
  it("un crédito pendiente NO suma al saldo disponible (sólo a pendientes)", () => {
    const libro = conLibro(credito());
    expect(calcularSaldo(libro, "ana")).toEqual({ disponible: 0, pendientes: 40, totalCanjeado: 0 });
  });

  it("suma tras la aprobación, y repetir la aprobación no duplica los puntos", () => {
    let libro = conLibro(credito());
    const primera = aprobarCredito(libro, "reporte:rep-1:validado", FECHA_2);
    expect(primera.cambio).toBe(true);
    libro = primera.libro;
    const segunda = aprobarCredito(libro, "reporte:rep-1:validado", FECHA_2);
    expect(segunda.cambio).toBe(false);
    libro = segunda.libro;
    expect(calcularSaldo(libro, "ana")).toEqual({ disponible: 40, pendientes: 0, totalCanjeado: 0 });
    expect(libro).toHaveLength(1);
  });

  it("registrar el mismo evento dos veces es idempotente (no hay doble crédito)", () => {
    const una = registrarCredito([], credito());
    const dos = registrarCredito(una.libro, credito({ id: "mov-otro" }));
    expect(dos.cambio).toBe(false);
    expect(dos.libro).toHaveLength(1);
    expect(dos.libro[0]?.id).toBe("mov-1");
  });

  it("exige un motivo en todo crédito y rechaza puntos negativos", () => {
    expect(() => registrarCredito([], credito({ motivo: "   " }))).toThrow(ReglaDeNegocioError);
    expect(() => registrarCredito([], credito({ puntos: -5 }))).toThrow(ReglaDeNegocioError);
  });

  it("cancelar un crédito pendiente lo deja fuera del saldo y exige motivo", () => {
    const libro = conLibro(credito());
    expect(() => cancelarCredito(libro, "reporte:rep-1:validado", "")).toThrow(ReglaDeNegocioError);
    const cancelado = cancelarCredito(libro, "reporte:rep-1:validado", "Reporte duplicado");
    expect(cancelado.movimiento?.estado).toBe("cancelado");
    expect(cancelado.movimiento?.motivo).toContain("Reporte duplicado");
    expect(calcularSaldo(cancelado.libro, "ana")).toEqual({ disponible: 0, pendientes: 0, totalCanjeado: 0 });
  });

  it("revertir una aprobación descuenta con un movimiento con motivo y es idempotente", () => {
    let libro = aprobarCredito(conLibro(credito()), "reporte:rep-1:validado", FECHA_2).libro;
    expect(() => revertirCredito(libro, "reporte:rep-1:validado", { id: "mov-r", motivo: " ", fecha: FECHA_2 })).toThrow(
      ReglaDeNegocioError,
    );
    const revertido = revertirCredito(libro, "reporte:rep-1:validado", { id: "mov-r", motivo: "Validación incorrecta", fecha: FECHA_2 });
    expect(revertido.cambio).toBe(true);
    expect(revertido.movimiento).toMatchObject({ tipo: "reversion", puntos: -40, estado: "aprobado", motivo: "Validación incorrecta" });
    libro = revertido.libro;
    expect(calcularSaldo(libro, "ana").disponible).toBe(0);
    const otraVez = revertirCredito(libro, "reporte:rep-1:validado", { id: "mov-r2", motivo: "Otra vez", fecha: FECHA_2 });
    expect(otraVez.cambio).toBe(false);
    expect(calcularSaldo(otraVez.libro, "ana").disponible).toBe(0);
  });

  it("no se revierte lo que nunca se aprobó", () => {
    const libro = conLibro(credito());
    expect(revertirCredito(libro, "reporte:rep-1:validado", { id: "x", motivo: "Motivo válido", fecha: FECHA }).cambio).toBe(false);
  });

  it("un reporte cancelado no conserva recompensas indebidas (pendientes y aprobadas)", () => {
    const libro = aprobarCredito(
      conLibro(
        credito(),
        credito({ id: "mov-2", claveEvento: "reporte:rep-2:validado", referenciaId: "rep-2", puntos: 40 }),
      ),
      "reporte:rep-1:validado",
      FECHA_2,
    ).libro;
    // rep-1 está aprobado; rep-2 sigue pendiente.
    let siguienteId = 0;
    const anulado1 = anularPorReferencia(libro, "rep-1", { motivo: "Reporte cancelado: duplicado", fecha: FECHA_2, nuevoId: () => `rev-${(siguienteId += 1)}` });
    const anulado2 = anularPorReferencia(anulado1.libro, "rep-2", { motivo: "Reporte cancelado: no procede", fecha: FECHA_2, nuevoId: () => `rev-${(siguienteId += 1)}` });
    expect(anulado1.afectados).toHaveLength(1);
    expect(anulado2.afectados).toHaveLength(1);
    expect(calcularSaldo(anulado2.libro, "ana")).toEqual({ disponible: 0, pendientes: 0, totalCanjeado: 0 });
    // Repetir la anulación no cambia nada.
    const repetido = anularPorReferencia(anulado2.libro, "rep-1", { motivo: "Reporte cancelado: duplicado", fecha: FECHA_2, nuevoId: () => "no-se-usa" });
    expect(repetido.afectados).toHaveLength(0);
  });

  describe("canjes", () => {
    const base = () => aprobarCredito(conLibro(credito({ puntos: 150 })), "reporte:rep-1:validado", FECHA).libro;

    it("descuenta del saldo disponible", () => {
      const resultado = registrarCanje(base(), { id: "can-1", identidadId: "ana", claveEvento: "canje:1", costo: 100, motivo: "Canje de ejemplo", fecha: FECHA_2 });
      expect(resultado.movimiento).toMatchObject({ tipo: "canje", puntos: -100, estado: "aprobado" });
      expect(calcularSaldo(resultado.libro, "ana")).toEqual({ disponible: 50, pendientes: 0, totalCanjeado: 100 });
    });

    it("rechaza un canje con saldo insuficiente y nunca deja el saldo negativo", () => {
      const libro = base();
      expect(() => registrarCanje(libro, { id: "can-1", identidadId: "ana", claveEvento: "canje:1", costo: 151, motivo: "Canje", fecha: FECHA_2 })).toThrow(
        expect.objectContaining({ name: "ReglaDeNegocioError", codigo: "saldo_insuficiente" }),
      );
      expect(calcularSaldo(libro, "ana").disponible).toBe(150);
    });

    it("los puntos pendientes NO alcanzan para canjear", () => {
      const libro = conLibro(credito({ puntos: 500 }));
      expect(() => registrarCanje(libro, { id: "can-1", identidadId: "ana", claveEvento: "canje:1", costo: 100, motivo: "Canje", fecha: FECHA_2 })).toThrow(
        ReglaDeNegocioError,
      );
    });

    it("repetir la misma solicitud de canje no cobra dos veces", () => {
      const primero = registrarCanje(base(), { id: "can-1", identidadId: "ana", claveEvento: "canje:1", costo: 100, motivo: "Canje", fecha: FECHA_2 });
      const segundo = registrarCanje(primero.libro, { id: "can-1b", identidadId: "ana", claveEvento: "canje:1", costo: 100, motivo: "Canje", fecha: FECHA_2 });
      expect(segundo.cambio).toBe(false);
      expect(calcularSaldo(segundo.libro, "ana").disponible).toBe(50);
    });

    it("rechaza costos que no sean enteros positivos y pide motivo", () => {
      expect(() => registrarCanje(base(), { id: "c", identidadId: "ana", claveEvento: "k1", costo: 0, motivo: "m", fecha: FECHA })).toThrow(ReglaDeNegocioError);
      expect(() => registrarCanje(base(), { id: "c", identidadId: "ana", claveEvento: "k2", costo: 10.5, motivo: "m", fecha: FECHA })).toThrow(ReglaDeNegocioError);
      expect(() => registrarCanje(base(), { id: "c", identidadId: "ana", claveEvento: "k3", costo: 10, motivo: " ", fecha: FECHA })).toThrow(ReglaDeNegocioError);
    });
  });

  it("cada identidad ve sólo su saldo y sus movimientos", () => {
    const libro = aprobarCredito(
      conLibro(credito(), credito({ id: "mov-b", identidadId: "bruno", claveEvento: "reporte:rep-9:validado", referenciaId: "rep-9", puntos: 25 })),
      "reporte:rep-9:validado",
      FECHA,
    ).libro;
    expect(calcularSaldo(libro, "ana")).toEqual({ disponible: 0, pendientes: 40, totalCanjeado: 0 });
    expect(calcularSaldo(libro, "bruno")).toEqual({ disponible: 25, pendientes: 0, totalCanjeado: 0 });
    expect(movimientosDe(libro, "bruno").map((m) => m.id)).toEqual(["mov-b"]);
  });

  it("totales del libro separan aprobados, pendientes, canjeados y revertidos", () => {
    let libro = aprobarCredito(conLibro(credito({ puntos: 100 })), "reporte:rep-1:validado", FECHA).libro;
    libro = registrarCanje(libro, { id: "c1", identidadId: "ana", claveEvento: "canje:1", costo: 30, motivo: "Canje", fecha: FECHA }).libro;
    libro = registrarCredito(libro, credito({ id: "p", claveEvento: "reporte:rep-3:validado", referenciaId: "rep-3", puntos: 40 })).libro;
    expect(totalesLibro(libro)).toEqual({ aprobados: 100, pendientes: 40, canjeados: 30, revertidos: 0 });
  });
});
