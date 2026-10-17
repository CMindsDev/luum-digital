import { expect, it } from "vitest";
import { crearSemillaDemo } from "@/services/adapters/demo/semillas";
import { consultarIncidencias } from "./consulta-operativa";
const reportes = crearSemillaDemo(new Date("2026-10-17T18:00:00Z")).reportes;
it("una consulta general de riesgo no restringe por palabras incidentales de la pregunta", () => {
  const esperado = reportes.filter(r => r.riesgoDeclarado && ["registrado", "en_proceso"].includes(r.estadoMunicipal));
  expect(consultarIncidencias(reportes, "¿Qué incidencias tienen riesgo declarado?")).toEqual(esperado);
});
it("combina categoría, colonia y estado sin ampliar a casos que no coinciden", () => {
  const resultados = consultarIncidencias(reportes, "Baches registrados en Centro");
  expect(resultados.length).toBeGreaterThan(0);
  expect(resultados.every(r => r.categoria === "bache" && r.estadoMunicipal === "registrado" && r.ubicacion.colonia === "Centro")).toBe(true);
  expect(consultarIncidencias(reportes, "Baches cancelados en Centro")).toEqual(reportes.filter(r => r.categoria === "bache" && r.estadoMunicipal === "cancelado" && r.ubicacion.colonia === "Centro"));
});
