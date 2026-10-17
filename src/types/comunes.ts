/**
 * Tipos transversales del prototipo.
 *
 * Convención: el vocabulario de dominio va en español (como en el brief y en las fuentes
 * municipales); los nombres técnicos (repositorios, hooks, componentes) van en inglés.
 */

/** Qué tan confiable es la información mostrada. */
export type EstadoInformacion =
  /** Consultada en una fuente oficial, con URL y fecha de consulta. */
  | "verificada"
  /** Existe en una fuente oficial, pero faltan datos o no se pudieron contrastar. */
  | "pendiente"
  /** Contenido ficticio creado para la demostración. */
  | "demostracion";

/** Si la interacción toca un sistema real o es una simulación local. */
export type EstadoIntegracion =
  /** Formularios, folios y estados se simulan en el navegador. */
  | "simulada"
  /** Conectada a un sistema real y comprobada (ninguna en esta entrega). */
  | "conectada";

/** Referencia a una fuente consultada. */
export interface FuenteConsultada {
  nombre: string;
  url: string;
  /** Fecha ISO (AAAA-MM-DD) en que el equipo consultó la fuente. */
  fechaConsulta: string;
  /** Fecha de actualización que publica la propia fuente, si la hay. */
  fechaActualizacionFuente?: string;
}

export interface Coordenadas {
  lat: number;
  lng: number;
}

/** Fecha y hora ISO 8601. */
export type FechaISO = string;
