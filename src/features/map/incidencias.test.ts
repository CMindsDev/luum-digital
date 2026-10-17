import { latLngToCell } from "h3-js";
import { describe, expect, it } from "vitest";
import { crearReportesSemilla } from "@/data/reportes-semilla";
import type { UbicacionServicio } from "@/types";
import { capasInteractivas, construirFuentes, ID_CAPA } from "./capas";
import {
  celdasAGeoJSON,
  celdasDeIncidencias,
  contarPorCategoria,
  contarPorEstado,
  filtrarIncidencias,
  incidenciasAGeoJSON,
  incidenciasEnCelda,
  separarUbicaciones,
} from "./incidencias";
import { leerColoresMapa } from "@/components/mapa/colores";

const reportes = crearReportesSemilla(new Date("2026-10-17T12:00:00Z"));

describe("incidencias del Visor", () => {
  it("filtra por categoría y estado (sin filtros devuelve todas)", () => {
    expect(filtrarIncidencias(reportes, { categorias: [], estados: [] })).toHaveLength(reportes.length);
    const baches = filtrarIncidencias(reportes, { categorias: ["bache"], estados: ["registrado"] });
    expect(baches.length).toBeGreaterThan(0);
    expect(baches.every((r) => r.categoria === "bache" && r.estadoMunicipal === "registrado")).toBe(true);
  });

  it("cuenta por categoría respetando el estado elegido, y por estado respetando la categoría", () => {
    const porCategoria = contarPorCategoria(reportes, ["registrado"]);
    expect(Object.values(porCategoria).reduce((a, b) => a + b, 0)).toBe(reportes.filter((r) => r.estadoMunicipal === "registrado").length);
    const porEstado = contarPorEstado(reportes, ["bache"]);
    expect(Object.values(porEstado).reduce((a, b) => a + b, 0)).toBe(reportes.filter((r) => r.categoria === "bache").length);
  });

  it("convierte incidencias a puntos GeoJSON [lng, lat] sin datos personales", () => {
    const geo = incidenciasAGeoJSON(reportes.slice(0, 3));
    expect(geo.features).toHaveLength(3);
    const [primera] = geo.features;
    expect(primera?.geometry.coordinates).toEqual([reportes[0]?.ubicacion.lng, reportes[0]?.ubicacion.lat]);
    expect(Object.keys(primera?.properties ?? {}).sort()).toEqual(["categoria", "estado", "id", "riesgo"]);
  });

  it("agrupa en celdas H3 (8 ciudad, 9 colonia) con anillos cerrados", () => {
    const ciudad = celdasDeIncidencias(reportes, 8);
    const colonia = celdasDeIncidencias(reportes, 9);
    expect(ciudad.reduce((a, c) => a + c.conteo, 0)).toBe(reportes.length);
    expect(colonia.length).toBeGreaterThanOrEqual(ciudad.length);
    const geo = celdasAGeoJSON(ciudad);
    const anillo = geo.features[0]?.geometry.coordinates[0] ?? [];
    expect(anillo.length).toBeGreaterThanOrEqual(7);
    expect(anillo[0]).toEqual(anillo[anillo.length - 1]);
    expect(geo.features[0]?.properties.conteo).toBe(ciudad[0]?.conteo);
  });

  it("encuentra las incidencias de una celda", () => {
    const primera = reportes[0]!;
    const h3 = latLngToCell(primera.ubicacion.lat, primera.ubicacion.lng, 8);
    const enCelda = incidenciasEnCelda(reportes, h3, 8);
    expect(enCelda.map((r) => r.id)).toContain(primera.id);
    expect(enCelda.length).toBe(celdasDeIncidencias(reportes, 8).find((c) => c.h3 === h3)?.conteo);
  });

  it("separa ubicaciones verificadas con coordenadas publicadas de las que sólo tienen dirección", () => {
    const fuente = { nombre: "Ficha", url: "https://example.org", fechaConsulta: "2026-10-17" };
    const ubicaciones: UbicacionServicio[] = [
      { id: "a", nombre: "A", direccion: "Calle 1", tipo: "salud_mental", fuente, verificado: true },
      { id: "b", nombre: "B", direccion: "Calle 2", tipo: "mujeres", fuente, verificado: true, lat: 20.97, lng: -89.62 },
      { id: "c", nombre: "C", direccion: "Calle 3", tipo: "salud", fuente, verificado: false, lat: 20.97, lng: -89.62 },
    ];
    const { conCoordenadas, sinCoordenadas } = separarUbicaciones(ubicaciones);
    expect(conCoordenadas.map((u) => u.id)).toEqual(["b"]);
    expect(sinCoordenadas.map((u) => u.id)).toEqual(["a"]);
  });
});

describe("capas del Visor", () => {
  const base = {
    incidencias: incidenciasAGeoJSON(reportes),
    celdas: celdasAGeoJSON(celdasDeIncidencias(reportes, 8)),
    maximoCelda: 5,
    bienestar: null,
    maximoBienestar: 1,
    sedes: { type: "FeatureCollection" as const, features: [] },
    colores: leerColoresMapa(null),
    fuentesRotulo: ["Noto Sans Bold"],
  };
  const capas = (fuentes: ReturnType<typeof construirFuentes>) => fuentes.flatMap((fuente) => fuente.capas);
  const visibilidad = (fuentes: ReturnType<typeof construirFuentes>, id: string) => capas(fuentes).find((capa) => capa.id === id)?.layout?.visibility;

  it("muestra sólo la representación elegida y conserva el orden de las capas", () => {
    const puntos = construirFuentes({ ...base, representacion: "puntos" });
    expect(visibilidad(puntos, ID_CAPA.puntos)).toBe("visible");
    expect(visibilidad(puntos, ID_CAPA.calor)).toBe("none");
    expect(visibilidad(puntos, ID_CAPA.celdasRelleno)).toBe("none");
    const calor = construirFuentes({ ...base, representacion: "calor" });
    expect(capas(calor).map((c) => c.id)).toEqual(capas(puntos).map((c) => c.id));
    expect(visibilidad(calor, ID_CAPA.calor)).toBe("visible");
    expect(capasInteractivas("puntos")).toEqual([ID_CAPA.grupos, ID_CAPA.puntos]);
    expect(capasInteractivas("celdas")).toEqual([ID_CAPA.celdasRelleno]);
    expect(capasInteractivas("calor")).toEqual([]);
  });

  it("agrupa los puntos (clusters) y sólo agrega bienestar o sedes cuando hay datos", () => {
    const fuentes = construirFuentes({ ...base, representacion: "puntos" });
    expect(fuentes.find((f) => f.id === "incidencias")?.agrupar).toEqual({ radio: 46, zoomMaximo: 14 });
    expect(fuentes.some((f) => f.id === "bienestar-agregado")).toBe(false);
    expect(fuentes.some((f) => f.id === "sedes")).toBe(false);
    const conBienestar = construirFuentes({ ...base, representacion: "puntos", bienestar: base.celdas });
    expect(conBienestar[0]?.id).toBe("bienestar-agregado");
  });

  it("sin fuentes tipográficas (mapa sin base) omite los rótulos de conteo", () => {
    const fuentes = construirFuentes({ ...base, representacion: "celdas", fuentesRotulo: [] });
    expect(capas(fuentes).some((capa) => capa.type === "symbol")).toBe(false);
  });
});
