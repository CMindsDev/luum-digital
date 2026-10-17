import { describe, expect, it } from "vitest";
import { areaValida, dentroDeArea, superficieArea } from "./area-operativa";
const area = [{ lat: 20.95, lng: -89.65 }, { lat: 21, lng: -89.65 }, { lat: 21, lng: -89.60 }, { lat: 20.95, lng: -89.60 }];
describe("Delimitación operativa", () => {
  it("incluye incidentes interiores y sobre los bordes, excluye exteriores", () => {
    expect(dentroDeArea({ lat: 20.98, lng: -89.63 }, area)).toBe(true);
    expect(dentroDeArea(area[0]!, area)).toBe(true);
    expect(dentroDeArea({ lat: 20.98, lng: -89.65 }, area)).toBe(true);
    expect(dentroDeArea({ lat: 21.02, lng: -89.63 }, area)).toBe(false);
  });
  it("rechaza áreas degeneradas o con bordes cruzados", () => {
    expect(areaValida(area)).toBe(true);
    expect(areaValida(area.slice(0, 2))).toBe(false);
    expect(areaValida([area[0]!, area[2]!, area[1]!, area[3]!])).toBe(false);
    expect(areaValida([area[0]!, area[0]!, area[0]!])).toBe(false);
  });
  it("calcula superficie aproximada independiente de la orientación", () => {
    expect(superficieArea(area)).toBeGreaterThan(28);
    expect(superficieArea(area)).toBeLessThan(30);
    expect(superficieArea([...area].reverse())).toBeCloseTo(superficieArea(area), 5);
  });
});

it("acepta un área cóncava con bordes alineados que no se tocan", () => {
  const vertices = [[0, 0], [2, 0], [2, 2], [1.5, 2], [1.5, 1], [.5, 1], [.5, 2], [0, 2]].map(([x, y]) => ({ lng: -89.65 + x! * .001, lat: 20.97 + y! * .001 }));
  expect(areaValida(vertices)).toBe(true);
  expect(dentroDeArea({ lng: -89.649, lat: 20.9715 }, vertices)).toBe(false);
  expect(dentroDeArea({ lng: -89.6498, lat: 20.9715 }, vertices)).toBe(true);
});
it("rechaza puntos no finitos y bordes que retroceden sobre sí mismos", () => {
  expect(areaValida([...area.slice(0, 3), { lat: NaN, lng: -89.6 }])).toBe(false);
  expect(areaValida([{ lat: 21, lng: -89.65 }, { lat: 21, lng: -89.60 }, { lat: 21, lng: -89.63 }, { lat: 20.95, lng: -89.63 }])).toBe(false);
});
it("mantiene precisión suficiente para una manzana pequeña", () => {
  const vertices = [{ lat: 20.97, lng: -89.62 }, { lat: 20.9701, lng: -89.62 }, { lat: 20.9701, lng: -89.6199 }, { lat: 20.97, lng: -89.6199 }];
  expect(areaValida(vertices)).toBe(true);
  expect(superficieArea(vertices) * 1_000_000).toBeGreaterThan(110);
  expect(superficieArea(vertices) * 1_000_000).toBeLessThan(120);
});
