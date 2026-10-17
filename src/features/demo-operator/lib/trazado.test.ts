import { describe, expect, it } from "vitest";
import { reducirTrazado, TRAZADO_INICIAL, type EstadoTrazado } from "./trazado";
const a = { lat: 20.95, lng: -89.65 }, b = { lat: 21, lng: -89.65 }, c = { lat: 21, lng: -89.60 };
const empezar = (): EstadoTrazado => reducirTrazado(TRAZADO_INICIAL, { tipo: "iniciar", vertices: [a, b, c] });
describe("Edición del área", () => {
  it("ignora el segundo toque de un doble clic y conserva deshacer", () => {
    let s = reducirTrazado(TRAZADO_INICIAL, { tipo: "agregar", punto: a });
    s = reducirTrazado(s, { tipo: "agregar", punto: a });
    expect(s.vertices).toEqual([a]);
    expect(s.anteriores).toHaveLength(1);
    expect(reducirTrazado(s, { tipo: "deshacer" }).vertices).toEqual([]);
  });
  it("mover el mapa no agrega puntos ni modifica el polígono", () => {
    const s = reducirTrazado(empezar(), { tipo: "modo", modo: "mover" });
    expect(reducirTrazado(s, { tipo: "agregar", punto: { lat: 20.98, lng: -89.63 } }).vertices).toEqual([a, b, c]);
  });
  it("deshace un arrastre como una sola operación aunque haya muchos movimientos", () => {
    let s = reducirTrazado(empezar(), { tipo: "empezar_arrastre", indice: 1 });
    s = reducirTrazado(s, { tipo: "mover", indice: 1, punto: { lat: 21.001, lng: -89.64 }, provisional: true });
    s = reducirTrazado(s, { tipo: "mover", indice: 1, punto: { lat: 21.002, lng: -89.63 }, provisional: true });
    s = reducirTrazado(s, { tipo: "terminar_arrastre", indice: 1, punto: { lat: 21.003, lng: -89.62 } });
    expect(s.anteriores).toHaveLength(1);
    expect(reducirTrazado(s, { tipo: "deshacer" }).vertices).toEqual([a, b, c]);
  });
  it("reiniciar y eliminar son reversibles y editar no modifica el área confirmada", () => {
    const confirmada = [a, b, c];
    let s = reducirTrazado(TRAZADO_INICIAL, { tipo: "iniciar", vertices: confirmada });
    s = reducirTrazado(s, { tipo: "seleccionar", indice: 1 });
    s = reducirTrazado(s, { tipo: "eliminar" });
    expect(s.vertices).toEqual([a, c]);
    expect(confirmada).toEqual([a, b, c]);
    s = reducirTrazado(s, { tipo: "deshacer" });
    s = reducirTrazado(s, { tipo: "reiniciar" });
    expect(s.vertices).toEqual([]);
    expect(reducirTrazado(s, { tipo: "deshacer" }).vertices).toEqual(confirmada);
  });
});
