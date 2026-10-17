import type { Coordenadas } from "@/types";

/**
 * Configuración del mapa compartida por el Visor Urbano y el selector de ubicación.
 *
 * Motor (react-map-gl 8):
 * - Si `VITE_MAPBOX_ACCESS_TOKEN` es un token PÚBLICO (`pk.`), se usa Mapbox GL JS (`mapbox-gl/esm`).
 *   Un token secreto (`sk.`) o cualquier otro valor se ignora: nunca debe llegar al navegador.
 * - Si no, MapLibre GL JS con el estilo «liberty» de OpenFreeMap (sin clave, atribución automática).
 *
 * No se descargan teselas en masa ni se guardan en caché sin conexión (el service worker sólo
 * guarda los recursos de la app). Si el mapa falla, la lista y los formularios siguen funcionando.
 */

export type MotorMapa = "mapbox" | "maplibre";

export interface ConfigMapa {
  motor: MotorMapa;
  /** Token público de Mapbox (sólo con motor "mapbox"). */
  tokenMapbox: string | null;
  /** URL del estilo del mapa base. */
  estilo: string;
  /** Fuentes tipográficas disponibles en el estilo para rótulos de capas propias (conteos de grupos). */
  fuentesRotulo: string[];
  /** Nombre del proveedor para avisos (la atribución formal la pone el propio mapa). */
  proveedor: string;
  /**
   * Sin mapa base: en pruebas automatizadas (sin red externa) se dibuja sólo un fondo liso y las capas
   * propias, sin pedir estilos ni teselas a terceros. Nunca se usa con personas.
   */
  sinMapaBase: boolean;
}

/** Estilo de OpenFreeMap: sin registro ni clave; incluye su atribución en el TileJSON. */
export const ESTILO_OPENFREEMAP = "https://tiles.openfreemap.org/styles/liberty";

/** Estilo clásico de Mapbox (si hay token y no se configuró uno propio). */
export const ESTILO_MAPBOX_PREDETERMINADO = "mapbox://styles/mapbox/light-v11";

/** Plaza Grande de Mérida (aproximada): centro de la vista de ciudad. */
export const CENTRO_MERIDA: Coordenadas = { lat: 20.9671, lng: -89.6237 };

export const ZOOM_CIUDAD = 11.4;
export const ZOOM_COLONIA = 14.5;
export const ZOOM_MINIMO = 9.5;
export const ZOOM_MAXIMO = 18;

/** Vista inicial de ciudad (centro de Mérida). */
export const VISTA_CIUDAD = { latitude: CENTRO_MERIDA.lat, longitude: CENTRO_MERIDA.lng, zoom: ZOOM_CIUDAD } as const;

/** Límites de navegación [oeste, sur, este, norte]: municipio de Mérida y alrededores (no es un límite oficial). */
export const LIMITES_NAVEGACION: [number, number, number, number] = [-90.05, 20.6, -89.25, 21.35];

/** Si el mapa no termina de cargar en este tiempo, se muestra el respaldo (lista y formularios). */
export const TIEMPO_LIMITE_CARGA_MS = 15_000;

export interface EntornoMapa {
  VITE_MAPBOX_ACCESS_TOKEN?: string;
  VITE_MAPBOX_STYLE_URL?: string;
  MODE?: string;
}

/** Sólo se aceptan tokens públicos de Mapbox. */
export function esTokenPublicoMapbox(valor: unknown): valor is string {
  return typeof valor === "string" && /^pk\.[A-Za-z0-9._-]{10,}$/.test(valor.trim());
}

function estiloMapboxValido(valor: unknown): valor is string {
  return typeof valor === "string" && (valor.startsWith("mapbox://styles/") || valor.startsWith("https://"));
}

/**
 * Decide motor, estilo y fuentes a partir de las variables públicas del entorno.
 * `automatizado`: navegador controlado por pruebas (navigator.webdriver) o build en modo «e2e».
 */
export function resolverConfigMapa(entorno: EntornoMapa, automatizado = false): ConfigMapa {
  if (automatizado || entorno.MODE === "e2e") {
    return { motor: "maplibre", tokenMapbox: null, estilo: "", fuentesRotulo: [], proveedor: "Sin mapa base (pruebas)", sinMapaBase: true };
  }
  const token = entorno.VITE_MAPBOX_ACCESS_TOKEN?.trim();
  if (esTokenPublicoMapbox(token)) {
    const estilo = entorno.VITE_MAPBOX_STYLE_URL?.trim();
    return {
      motor: "mapbox",
      tokenMapbox: token,
      estilo: estiloMapboxValido(estilo) ? estilo : ESTILO_MAPBOX_PREDETERMINADO,
      fuentesRotulo: ["DIN Pro Medium", "Arial Unicode MS Regular"],
      proveedor: "Mapbox",
      sinMapaBase: false,
    };
  }
  return {
    motor: "maplibre",
    tokenMapbox: null,
    estilo: ESTILO_OPENFREEMAP,
    fuentesRotulo: ["Noto Sans Bold"],
    proveedor: "OpenFreeMap",
    sinMapaBase: false,
  };
}

/** Pruebas automatizadas: la red externa está bloqueada y no debe pedirse nada a terceros. */
const navegadorAutomatizado = typeof navigator !== "undefined" && navigator.webdriver === true;

/** Configuración vigente de la app. */
export const configMapa: ConfigMapa = resolverConfigMapa(import.meta.env, navegadorAutomatizado);

/** Textos de los controles del mapa en español (MapLibre y Mapbox usan las mismas claves). */
export function textosMapa(etiqueta: string): Record<string, string> {
  return {
    "Map.Title": etiqueta,
    "Marker.Title": "Marcador del mapa",
    "NavigationControl.ZoomIn": "Acercar",
    "NavigationControl.ZoomOut": "Alejar",
    "NavigationControl.ResetBearing": "Orientar al norte",
    "AttributionControl.ToggleAttribution": "Mostrar u ocultar la atribución del mapa",
    "AttributionControl.MapFeedback": "Sugerir una corrección al mapa base",
    "FullscreenControl.Enter": "Pantalla completa",
    "FullscreenControl.Exit": "Salir de pantalla completa",
    "GeolocateControl.FindMyLocation": "Buscar mi ubicación",
    "GeolocateControl.LocationNotAvailable": "Ubicación no disponible",
    "LogoControl.Title": "Logotipo del proveedor del mapa",
    "Popup.Close": "Cerrar",
    "ScaleControl.Meters": "m",
    "ScaleControl.Kilometers": "km",
    "CooperativeGesturesHandler.WindowsHelpText": "Usa Ctrl + rueda del ratón para acercar o alejar el mapa",
    "CooperativeGesturesHandler.MacHelpText": "Usa ⌘ + rueda del ratón para acercar o alejar el mapa",
    "CooperativeGesturesHandler.MobileHelpText": "Usa dos dedos para mover el mapa",
    // Claves equivalentes de Mapbox GL JS.
    "ScrollZoomBlocker.CtrlMessage": "Usa Ctrl + rueda del ratón para acercar o alejar el mapa",
    "ScrollZoomBlocker.CmdMessage": "Usa ⌘ + rueda del ratón para acercar o alejar el mapa",
    "TouchPanBlocker.Message": "Usa dos dedos para mover el mapa",
  };
}

/** true si las coordenadas caen dentro de los límites de navegación del mapa. */
export function dentroDeLimites(coordenadas: Coordenadas, limites: readonly [number, number, number, number] = LIMITES_NAVEGACION): boolean {
  const [oeste, sur, este, norte] = limites;
  return coordenadas.lng >= oeste && coordenadas.lng <= este && coordenadas.lat >= sur && coordenadas.lat <= norte;
}

/** Redondea a 5 decimales (≈ 1 m): suficiente para ubicar un reporte, sin falsa precisión. */
export function redondearCoordenadas(coordenadas: Coordenadas): Coordenadas {
  const redondear = (valor: number) => Math.round(valor * 100_000) / 100_000;
  return { lat: redondear(coordenadas.lat), lng: redondear(coordenadas.lng) };
}

/** Texto legible de unas coordenadas («20.96710, -89.62370»). */
export function formatearCoordenadas(coordenadas: Coordenadas): string {
  return `${coordenadas.lat.toFixed(5)}, ${coordenadas.lng.toFixed(5)}`;
}
