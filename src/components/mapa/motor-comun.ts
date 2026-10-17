import type { ClicMapa, ControlMapa, ObjetoMapa } from "./tipos";

/**
 * Piezas comunes de MotorMaplibre y MotorMapbox. Se escriben contra formas mínimas (estructurales)
 * para servir a ambos motores sin depender de sus tipos concretos.
 */

interface LngLatMinimo {
  lng: number;
  lat: number;
}

interface ObjetoRenderizadoMinimo {
  layer?: { id: string };
  properties?: Record<string, unknown> | null;
  geometry?: { type: string; coordinates?: unknown };
}

interface CamaraMinima {
  easeTo: (opciones: { center: [number, number]; zoom: number; duration: number }) => unknown;
  getCenter: () => LngLatMinimo;
  getZoom: () => number;
}

function esParCoordenadas(valor: unknown): valor is [number, number] {
  return Array.isArray(valor) && valor.length >= 2 && typeof valor[0] === "number" && typeof valor[1] === "number";
}

/** Traduce el clic del motor a un ClicMapa (posición + objetos de las capas interactivas). */
export function convertirClic(lngLat: LngLatMinimo, objetos: readonly ObjetoRenderizadoMinimo[] | undefined): ClicMapa {
  return {
    posicion: { lat: lngLat.lat, lng: lngLat.lng },
    objetos: (objetos ?? []).map((objeto): ObjetoMapa => {
      const coordenadas = objeto.geometry?.type === "Point" ? objeto.geometry.coordinates : undefined;
      return {
        capa: objeto.layer?.id ?? "",
        propiedades: objeto.properties ?? {},
        ...(esParCoordenadas(coordenadas) ? { punto: { lng: coordenadas[0], lat: coordenadas[1] } } : {}),
      };
    }),
  };
}

/** Control de cámara a partir de la referencia del mapa. */
export function crearControl(mapa: CamaraMinima, sinAnimacion: boolean): ControlMapa {
  return {
    volarA: ({ centro, zoom }) => {
      mapa.easeTo({ center: [centro.lng, centro.lat], zoom: zoom ?? mapa.getZoom(), duration: sinAnimacion ? 0 : 650 });
    },
    centro: () => {
      const { lat, lng } = mapa.getCenter();
      return { lat, lng };
    },
    zoom: () => mapa.getZoom(),
  };
}

/** Mensaje legible de un error del motor (sin detalles técnicos ni URLs con claves). */
export function motivoDeFallo(error: unknown): string {
  const mensaje = error instanceof Error ? error.message : "";
  if (/webgl/i.test(mensaje)) return "Tu navegador no pudo iniciar los gráficos del mapa (WebGL).";
  if (/style|estilo|fetch|network|load/i.test(mensaje)) return "No se pudo descargar el mapa base.";
  return "El mapa no respondió como se esperaba.";
}
