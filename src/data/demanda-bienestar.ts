/**
 * Demanda de bienestar AGREGADA con conteos FICTICIOS por zona (se agrupan en celdas H3 de resolución 7
 * con src/domain/demanda.ts). No provienen de conversaciones ni de personas: sirven para mostrar cómo
 * se vería una vista agregada para operador/administración. Algunas zonas quedan por debajo del umbral
 * (10) a propósito, para demostrar que se ocultan.
 */
export const LEYENDA_DEMANDA_BIENESTAR = "Datos ficticios agregados; no provienen de conversaciones.";

export const UMBRAL_DEMANDA_BIENESTAR = 10;

export const RESOLUCION_DEMANDA_BIENESTAR = 7;

export interface ZonaDemandaFicticia {
  lat: number;
  lng: number;
  conteo: number;
}

export const ZONAS_DEMANDA_FICTICIA: readonly ZonaDemandaFicticia[] = [
  { lat: 20.9671, lng: -89.6237, conteo: 34 },
  { lat: 20.9208, lng: -89.6068, conteo: 41 },
  { lat: 20.9241, lng: -89.6311, conteo: 27 },
  { lat: 20.9601, lng: -89.5852, conteo: 22 },
  { lat: 20.9998, lng: -89.7065, conteo: 29 },
  { lat: 21.0105, lng: -89.6745, conteo: 18 },
  { lat: 20.9668, lng: -89.6738, conteo: 15 },
  { lat: 20.9724, lng: -89.5747, conteo: 12 },
  { lat: 21.0285, lng: -89.6542, conteo: 11 },
  { lat: 20.9952, lng: -89.6098, conteo: 9 },
  { lat: 21.0189, lng: -89.5824, conteo: 6 },
  { lat: 21.0453, lng: -89.5598, conteo: 4 },
  { lat: 21.0375, lng: -89.6203, conteo: 7 },
  { lat: 20.9432, lng: -89.6112, conteo: 13 },
  { lat: 20.9536, lng: -89.6189, conteo: 8 },
];
