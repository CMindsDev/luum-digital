import { describe, expect, it } from "vitest";
import {
  dentroDeLimites,
  ESTILO_MAPBOX_PREDETERMINADO,
  ESTILO_OPENFREEMAP,
  esTokenPublicoMapbox,
  formatearCoordenadas,
  redondearCoordenadas,
  resolverConfigMapa,
  textosMapa,
} from "./config";
import { convertirClic, motivoDeFallo } from "./motor-comun";

const TOKEN_PUBLICO = "pk.eyJ1IjoiZGVtbyIsImEiOiJjbGFiYzEyMyJ9.abcdEFGH_ijkl";

describe("configuración del mapa", () => {
  it("sin token usa MapLibre con el estilo de OpenFreeMap", () => {
    const config = resolverConfigMapa({});
    expect(config).toMatchObject({ motor: "maplibre", tokenMapbox: null, estilo: ESTILO_OPENFREEMAP, sinMapaBase: false });
    expect(config.fuentesRotulo).toEqual(["Noto Sans Bold"]);
  });

  it("con un token público pk. usa Mapbox y su estilo predeterminado", () => {
    const config = resolverConfigMapa({ VITE_MAPBOX_ACCESS_TOKEN: TOKEN_PUBLICO });
    expect(config).toMatchObject({ motor: "mapbox", tokenMapbox: TOKEN_PUBLICO, estilo: ESTILO_MAPBOX_PREDETERMINADO });
  });

  it("respeta VITE_MAPBOX_STYLE_URL sólo si es un estilo válido", () => {
    expect(resolverConfigMapa({ VITE_MAPBOX_ACCESS_TOKEN: TOKEN_PUBLICO, VITE_MAPBOX_STYLE_URL: "mapbox://styles/ayto/abc" }).estilo).toBe(
      "mapbox://styles/ayto/abc",
    );
    expect(resolverConfigMapa({ VITE_MAPBOX_ACCESS_TOKEN: TOKEN_PUBLICO, VITE_MAPBOX_STYLE_URL: "javascript:alert(1)" }).estilo).toBe(
      ESTILO_MAPBOX_PREDETERMINADO,
    );
  });

  it("nunca acepta un token secreto sk. ni valores raros", () => {
    expect(esTokenPublicoMapbox("sk.eyJ1IjoiZGVtbyIsImEiOiJzZWNyZXRvIn0.x")).toBe(false);
    expect(esTokenPublicoMapbox("pk.")).toBe(false);
    expect(esTokenPublicoMapbox(undefined)).toBe(false);
    expect(resolverConfigMapa({ VITE_MAPBOX_ACCESS_TOKEN: "sk.eyJ1IjoiZGVtbyIsImEiOiJzZWNyZXRvIn0.x" }).motor).toBe("maplibre");
  });

  it("en pruebas automatizadas o en modo e2e no pide mapa base a terceros", () => {
    expect(resolverConfigMapa({ VITE_MAPBOX_ACCESS_TOKEN: TOKEN_PUBLICO }, true)).toMatchObject({
      motor: "maplibre",
      tokenMapbox: null,
      sinMapaBase: true,
      fuentesRotulo: [],
    });
    expect(resolverConfigMapa({ MODE: "e2e" }).sinMapaBase).toBe(true);
  });

  it("traduce los controles y usa la etiqueta como nombre del lienzo", () => {
    const textos = textosMapa("Mapa de prueba");
    expect(textos["Map.Title"]).toBe("Mapa de prueba");
    expect(textos["NavigationControl.ZoomIn"]).toBe("Acercar");
  });

  it("limita, redondea y formatea coordenadas", () => {
    expect(dentroDeLimites({ lat: 20.9671, lng: -89.6237 })).toBe(true);
    expect(dentroDeLimites({ lat: 19.43, lng: -99.13 })).toBe(false);
    expect(redondearCoordenadas({ lat: 20.967123456, lng: -89.623749999 })).toEqual({ lat: 20.96712, lng: -89.62375 });
    expect(formatearCoordenadas({ lat: 20.9671, lng: -89.6237 })).toBe("20.96710, -89.62370");
  });
});

describe("piezas comunes de los motores", () => {
  it("convierte el clic en posición y objetos con su capa, propiedades y punto", () => {
    const clic = convertirClic({ lat: 21, lng: -89.6 }, [
      { layer: { id: "incidencias-puntos" }, properties: { id: "rep-0001" }, geometry: { type: "Point", coordinates: [-89.61, 20.96] } },
      { layer: { id: "zonas" }, properties: null, geometry: { type: "Polygon", coordinates: [] } },
    ]);
    expect(clic.posicion).toEqual({ lat: 21, lng: -89.6 });
    expect(clic.objetos[0]).toEqual({ capa: "incidencias-puntos", propiedades: { id: "rep-0001" }, punto: { lng: -89.61, lat: 20.96 } });
    expect(clic.objetos[1]).toEqual({ capa: "zonas", propiedades: {} });
  });

  it("describe los fallos sin detalles técnicos", () => {
    expect(motivoDeFallo(new Error("Failed to initialize WebGL"))).toMatch(/WebGL/);
    expect(motivoDeFallo(new Error("Failed to fetch style"))).toBe("No se pudo descargar el mapa base.");
    expect(motivoDeFallo("raro")).toBe("El mapa no respondió como se esperaba.");
  });
});
