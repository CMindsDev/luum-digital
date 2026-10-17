import type { Rol } from "./identidad";

/** Capas del Visor Urbano del prototipo. Cada una declara su naturaleza y quién puede verla. */
export type CapaMapaId =
  | "incidencias_puntos"
  | "incidencias_calor"
  | "incidencias_celdas"
  | "servicios_verificados"
  | "territorial_ilustrativa"
  | "demanda_bienestar_agregada";

export interface CapaMapa {
  id: CapaMapaId;
  nombre: string;
  descripcion: string;
  /** demostracion = datos ficticios; oficial = fuente autorizada; ilustrativa = forma de ejemplo sin valor oficial. */
  naturaleza: "demostracion" | "oficial" | "ilustrativa";
  visiblePara: Rol[];
}

/** Celda H3 agregada (estilo zonas de alta demanda). */
export interface CeldaDemanda {
  h3: string;
  conteo: number;
  resolucion: number;
}

/** Demanda de bienestar agregada: sólo roles operador/administración, con umbral mínimo de conteo. */
export interface DemandaAgregada {
  celdas: CeldaDemanda[];
  umbralMinimo: number;
  celdasOcultas: number;
  leyenda: string;
}
