import { describe, expect, it } from "vitest";
import { alternar, ESTADO_VISOR_INICIAL, escribirEstadoVisor, filtrosActivos, leerEstadoVisor } from "./estado-url";

const leer = (consulta: string) => leerEstadoVisor(new URLSearchParams(consulta));

describe("estado del Visor en la URL", () => {
  it("sin parámetros usa el estado inicial y no escribe nada", () => {
    expect(leer("")).toEqual(ESTADO_VISOR_INICIAL);
    expect(escribirEstadoVisor(ESTADO_VISOR_INICIAL).toString()).toBe("");
  });

  it("lee filtros repetidos o separados por comas, sin duplicados y en orden canónico", () => {
    const estado = leer("categoria=luminaria&categoria=bache,luminaria&estado=solucionado&estado=registrado");
    expect(estado.categorias).toEqual(["bache", "luminaria"]);
    expect(estado.estados).toEqual(["registrado", "solucionado"]);
  });

  it("ignora valores desconocidos y ids de reporte inválidos", () => {
    const estado = leer("vista=satelite&capa=3d&res=12&categoria=ovni&estado=archivado&reporte=<script>");
    expect(estado).toEqual(ESTADO_VISOR_INICIAL);
  });

  it("acepta el formato del asistente (vista=puntos|calor|celdas|lista y reporte)", () => {
    expect(leer("vista=calor&categoria=bache")).toMatchObject({ vista: "mapa", capa: "calor", categorias: ["bache"] });
    expect(leer("vista=celdas")).toMatchObject({ vista: "mapa", capa: "celdas" });
    expect(leer("vista=lista")).toMatchObject({ vista: "lista", capa: "puntos" });
    expect(leer("reporte=rep-0001").reporteId).toBe("rep-0001");
  });

  it("ida y vuelta: escribir y leer conserva el estado", () => {
    const estado = {
      vista: "lista" as const,
      capa: "celdas" as const,
      resolucion: 9 as const,
      categorias: ["bache" as const, "luminaria" as const],
      estados: ["en_proceso" as const],
      reporteId: "rep-0007",
      bienestar: true,
    };
    const url = escribirEstadoVisor(estado);
    expect(url.toString()).toBe("vista=lista&capa=celdas&res=9&categoria=bache&categoria=luminaria&estado=en_proceso&reporte=rep-0007&bienestar=1");
    expect(leerEstadoVisor(url)).toEqual(estado);
  });

  it("alterna filtros y cuenta los activos", () => {
    expect(alternar(["bache"], "luminaria", true)).toEqual(["bache", "luminaria"]);
    expect(alternar(["bache", "luminaria"], "bache", false)).toEqual(["luminaria"]);
    expect(alternar(["bache"], "bache", true)).toEqual(["bache"]);
    expect(filtrosActivos({ categorias: ["bache"], estados: ["registrado", "cancelado"] })).toBe(3);
  });
});
