import type { CircleLayerSpecification } from "maplibre-gl";
import type { ReactNode } from "react";
import type { Coordenadas } from "@/types";
import type { ConfigMapa } from "./config";

/**
 * Contrato independiente del motor (MapLibre o Mapbox). Las capas se describen como datos con la
 * especificación de estilo común a ambos motores; cada motor las pinta con sus componentes.
 * (Los tipos de MapLibre sólo se usan como tipos: no se carga la librería por importarlos.)
 */

export interface VistaMapa {
  latitude: number;
  longitude: number;
  zoom: number;
}

/** GeoJSON mínimo que usa el prototipo (puntos y polígonos). */
export type GeometriaPunto = { type: "Point"; coordinates: [number, number] };
export type GeometriaLinea = { type: "LineString"; coordinates: [number, number][] };
export type GeometriaPoligono = { type: "Polygon"; coordinates: [number, number][][] };
export type PropiedadesGeo = Record<string, string | number | boolean | null>;

export type ElementoGeo<G extends GeometriaPunto | GeometriaPoligono | GeometriaLinea = GeometriaPunto | GeometriaPoligono | GeometriaLinea, P extends PropiedadesGeo = PropiedadesGeo> = {
  type: "Feature";
  id?: string | number;
  geometry: G;
  properties: P;
};

export type ColeccionGeo<G extends GeometriaPunto | GeometriaPoligono | GeometriaLinea = GeometriaPunto | GeometriaPoligono | GeometriaLinea, P extends PropiedadesGeo = PropiedadesGeo> = {
  type: "FeatureCollection";
  features: ElementoGeo<G, P>[];
};

/**
 * Expresión de estilo. Se toma el tipo estricto de MapLibre, que también cumple la forma
 * `[string, ...any[]]` de Mapbox.
 */
export type ExpresionMapa = Extract<NonNullable<NonNullable<CircleLayerSpecification["paint"]>["circle-radius"]>, unknown[]>;

type Valor<T> = T | ExpresionMapa;

interface CapaBase {
  id: string;
  minzoom?: number;
  maxzoom?: number;
  filter?: ExpresionMapa;
}

interface DisposicionBase {
  visibility?: "visible" | "none";
}

export interface CapaCirculo extends CapaBase {
  type: "circle";
  layout?: DisposicionBase;
  paint?: {
    "circle-color"?: Valor<string>;
    "circle-radius"?: Valor<number>;
    "circle-opacity"?: Valor<number>;
    "circle-stroke-color"?: Valor<string>;
    "circle-stroke-width"?: Valor<number>;
  };
}

export interface CapaCalor extends CapaBase {
  type: "heatmap";
  layout?: DisposicionBase;
  paint?: {
    "heatmap-weight"?: Valor<number>;
    "heatmap-intensity"?: Valor<number>;
    "heatmap-color"?: ExpresionMapa;
    "heatmap-radius"?: Valor<number>;
    "heatmap-opacity"?: Valor<number>;
  };
}

export interface CapaRelleno extends CapaBase {
  type: "fill";
  layout?: DisposicionBase;
  paint?: {
    "fill-color"?: Valor<string>;
    "fill-opacity"?: Valor<number>;
  };
}

export interface CapaLinea extends CapaBase {
  type: "line";
  layout?: DisposicionBase & { "line-join"?: "round" | "miter" | "bevel" };
  paint?: {
    "line-color"?: Valor<string>;
    "line-width"?: Valor<number>;
    "line-opacity"?: Valor<number>;
    "line-dasharray"?: number[];
  };
}

export interface CapaSimbolo extends CapaBase {
  type: "symbol";
  layout?: DisposicionBase & {
    "text-field"?: Valor<string>;
    "text-font"?: string[];
    "text-size"?: Valor<number>;
    "text-allow-overlap"?: boolean;
  };
  paint?: {
    "text-color"?: Valor<string>;
    "text-halo-color"?: Valor<string>;
    "text-halo-width"?: number;
  };
}

/**
 * Capa de estilo común a MapLibre y Mapbox (sin `source`: la fuente la pone el motor). Sólo incluye
 * las propiedades que usa el prototipo, con tipos que ambos motores aceptan.
 */
export type EspecCapa = CapaCirculo | CapaCalor | CapaRelleno | CapaLinea | CapaSimbolo;

export interface FuenteMapa {
  id: string;
  datos: ColeccionGeo;
  /** Agrupa puntos cercanos (clusters) en la fuente. */
  agrupar?: { radio: number; zoomMaximo: number };
  capas: EspecCapa[];
}

export interface MarcadorContenidoMapa {
  id: string;
  posicion: Coordenadas;
  contenido: ReactNode;
  arrastrable?: boolean;
  onArrastrado?: (posicion: Coordenadas) => void;
  onArrastrando?: (posicion: Coordenadas) => void;
  onArrastreIniciado?: () => void;
}

export interface MarcadorMapa {
  posicion: Coordenadas;
  etiqueta: string;
  arrastrable?: boolean;
  onArrastrado?: (posicion: Coordenadas) => void;
}

/** Objeto de una capa interactiva bajo el puntero al hacer clic. */
export interface ObjetoMapa {
  capa: string;
  propiedades: Record<string, unknown>;
  /** Coordenadas del objeto si es un punto. */
  punto?: Coordenadas;
}

export interface ClicMapa {
  posicion: Coordenadas;
  objetos: ObjetoMapa[];
}

/** Control imperativo mínimo que el motor expone (cámara). */
export interface ControlMapa {
  volarA: (destino: { centro: Coordenadas; zoom?: number }) => void;
  centro: () => Coordenadas;
  zoom: () => number;
}

export type EstadoCargaMapa = "cargando" | "listo" | "fallido";

/** Propiedades comunes de MotorMaplibre y MotorMapbox. */
export interface PropsMotorMapa {
  config: ConfigMapa;
  /** Nombre accesible del lienzo del mapa. */
  etiqueta: string;
  /** Id del texto que describe el mapa (se asocia al lienzo con aria-describedby). */
  idDescripcion?: string;
  vistaInicial: VistaMapa;
  fuentes: FuenteMapa[];
  /** Ids de capas que responden a clic y cambian el cursor. */
  capasInteractivas: string[];
  marcador?: MarcadorMapa | null;
  marcadores?: MarcadorContenidoMapa[];
  /** Gestos cooperativos (dos dedos en móvil, Ctrl + rueda en escritorio) para mapas dentro de formularios. */
  cooperativo: boolean;
  /** Sin animaciones de cámara (prefers-reduced-motion). */
  sinAnimacion: boolean;
  interaccion?: "normal" | "trazar" | "mover";
  onPuntero?: (posicion: Coordenadas | null) => void;
  onClic?: (clic: ClicMapa) => void;
  onMovido?: (vista: VistaMapa) => void;
  onCargado: () => void;
  onFallo: (motivo: string) => void;
  registrarControl: (control: ControlMapa | null) => void;
  children?: ReactNode;
}
