import type { ColoresMapa } from "@/components/mapa/colores";
import type { ColeccionGeo, EspecCapa, FuenteMapa } from "@/components/mapa/tipos";
import type { Representacion } from "./estado-url";

/**
 * Fuentes y capas del Visor Urbano (especificación de estilo común a MapLibre y Mapbox).
 * Orden de dibujo (de abajo arriba): bienestar agregado → zonas H3 → calor → incidencias → sedes.
 * Las capas no usadas se ocultan con `visibility` para conservar el orden al alternarlas.
 */

export const ID_CAPA = {
  bienestarRelleno: "bienestar-agregado-relleno",
  bienestarBorde: "bienestar-agregado-borde",
  celdasRelleno: "incidencias-zonas-relleno",
  celdasBorde: "incidencias-zonas-borde",
  celdasConteo: "incidencias-zonas-conteo",
  calor: "incidencias-calor",
  grupos: "incidencias-grupos",
  gruposConteo: "incidencias-grupos-conteo",
  puntos: "incidencias-puntos",
  sedes: "sedes-verificadas",
} as const;

export interface EntradaCapas {
  incidencias: ColeccionGeo;
  celdas: ColeccionGeo;
  maximoCelda: number;
  /** null si la persona no tiene acceso o la capa está apagada. */
  bienestar: ColeccionGeo | null;
  maximoBienestar: number;
  sedes: ColeccionGeo;
  representacion: Representacion;
  colores: ColoresMapa;
  /** Fuentes tipográficas del estilo para los conteos. */
  fuentesRotulo: string[];
}

const visible = (activa: boolean) => ({ visibility: activa ? ("visible" as const) : ("none" as const) });

/** Rampa de color por conteo (de suave a intenso). */
function rampaConteo(maximo: number, colores: [string, string, string]) {
  const medio = Math.max(2, Math.ceil(maximo / 2));
  const tope = Math.max(medio + 1, maximo);
  return ["interpolate", ["linear"], ["get", "conteo"], 1, colores[0], medio, colores[1], tope, colores[2]] satisfies EspecCapaColor;
}

type EspecCapaColor = NonNullable<NonNullable<Extract<EspecCapa, { type: "fill" }>["paint"]>["fill-color"]>;

/** Los rótulos necesitan fuentes tipográficas del estilo; sin ellas (mapa sin base) se omiten. */
function conRotulos(entrada: EntradaCapas, capa: EspecCapa): EspecCapa[] {
  return entrada.fuentesRotulo.length > 0 ? [capa] : [];
}

export function construirFuentes(entrada: EntradaCapas): FuenteMapa[] {
  const { colores, representacion } = entrada;
  const fuentes: FuenteMapa[] = [];

  if (entrada.bienestar) {
    fuentes.push({
      id: "bienestar-agregado",
      datos: entrada.bienestar,
      capas: [
        {
          id: ID_CAPA.bienestarRelleno,
          type: "fill",
          paint: {
            "fill-color": colores.magenta,
            "fill-opacity": ["interpolate", ["linear"], ["get", "conteo"], 1, 0.12, Math.max(2, entrada.maximoBienestar), 0.4],
          },
        },
        {
          id: ID_CAPA.bienestarBorde,
          type: "line",
          paint: { "line-color": colores["magenta-fuerte"], "line-width": 2, "line-dasharray": [2, 1.5] },
        },
      ],
    });
  }

  fuentes.push({
    id: "incidencias-zonas",
    datos: entrada.celdas,
    capas: [
      {
        id: ID_CAPA.celdasRelleno,
        type: "fill",
        layout: visible(representacion === "celdas"),
        paint: {
          "fill-color": rampaConteo(entrada.maximoCelda, [colores["ambar-suave"], colores.ambar, colores.cafe]),
          "fill-opacity": 0.62,
        },
      },
      {
        id: ID_CAPA.celdasBorde,
        type: "line",
        layout: visible(representacion === "celdas"),
        paint: { "line-color": colores.cafe, "line-width": 1.2, "line-opacity": 0.8 },
      },
      ...conRotulos(entrada, {
        id: ID_CAPA.celdasConteo,
        type: "symbol",
        layout: {
          ...visible(representacion === "celdas"),
          "text-field": ["to-string", ["get", "conteo"]],
          "text-font": entrada.fuentesRotulo,
          "text-size": 13,
          "text-allow-overlap": false,
        },
        paint: { "text-color": colores.tinta, "text-halo-color": colores.superficie, "text-halo-width": 1.5 },
      }),
    ],
  });

  fuentes.push({
    id: "incidencias-calor-fuente",
    datos: entrada.incidencias,
    capas: [
      {
        id: ID_CAPA.calor,
        type: "heatmap",
        layout: visible(representacion === "calor"),
        paint: {
          "heatmap-weight": 1,
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 9, 0.8, 15, 2.5],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 9, 14, 13, 26, 16, 40],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(0, 0, 0, 0)",
            0.15,
            colores["azul-suave"],
            0.35,
            colores.azul,
            0.6,
            colores.ambar,
            0.85,
            colores.magenta,
            1,
            colores["magenta-fuerte"],
          ],
          "heatmap-opacity": 0.85,
        },
      },
    ],
  });

  fuentes.push({
    id: "incidencias",
    datos: entrada.incidencias,
    agrupar: { radio: 46, zoomMaximo: 14 },
    capas: [
      {
        id: ID_CAPA.grupos,
        type: "circle",
        filter: ["has", "point_count"],
        layout: visible(representacion === "puntos"),
        paint: {
          "circle-color": colores.marino,
          "circle-radius": ["step", ["get", "point_count"], 15, 10, 19, 25, 24],
          "circle-stroke-color": colores["lima-logo"],
          "circle-stroke-width": 2.5,
        },
      },
      ...conRotulos(entrada, {
        id: ID_CAPA.gruposConteo,
        type: "symbol",
        filter: ["has", "point_count"],
        layout: {
          ...visible(representacion === "puntos"),
          "text-field": ["to-string", ["get", "point_count"]],
          "text-font": entrada.fuentesRotulo,
          "text-size": 13,
          "text-allow-overlap": true,
        },
        paint: { "text-color": colores.superficie },
      }),
      {
        id: ID_CAPA.puntos,
        type: "circle",
        filter: ["!", ["has", "point_count"]],
        layout: visible(representacion === "puntos"),
        paint: {
          "circle-color": [
            "match",
            ["get", "estado"],
            "registrado",
            colores["estado-registrado"],
            "en_proceso",
            colores["estado-proceso"],
            "solucionado",
            colores["estado-solucionado"],
            "cancelado",
            colores["estado-cancelado"],
            colores.marino,
          ],
          "circle-radius": ["case", ["==", ["get", "riesgo"], true], 9, 7],
          "circle-stroke-color": colores.marino,
          "circle-stroke-width": 1.5,
        },
      },
    ],
  });

  if (entrada.sedes.features.length > 0) {
    fuentes.push({
      id: "sedes",
      datos: entrada.sedes,
      capas: [
        {
          id: ID_CAPA.sedes,
          type: "circle",
          paint: {
            "circle-color": colores.azul,
            "circle-radius": 7,
            "circle-stroke-color": colores.superficie,
            "circle-stroke-width": 2,
          },
        },
      ],
    });
  }

  return fuentes;
}

/** Capas que responden a clic según la representación activa. */
export function capasInteractivas(representacion: Representacion): string[] {
  if (representacion === "puntos") return [ID_CAPA.grupos, ID_CAPA.puntos];
  if (representacion === "celdas") return [ID_CAPA.celdasRelleno];
  return [];
}
