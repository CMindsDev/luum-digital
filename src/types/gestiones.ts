import type { FechaISO } from "./comunes";
import type { TipoRecorrido } from "./catalogo";

/** Estados de una gestión simulada ("Mis gestiones"). */
export type EstadoGestion =
  | "borrador"
  | "enviada"
  | "en_revision"
  | "requiere_informacion"
  | "resuelta"
  | "cancelada";

export interface EventoGestion {
  fecha: FechaISO;
  estado: EstadoGestion;
  descripcion: string;
  actor: "ciudadania" | "sistema_demo" | "operador";
}

export interface Gestion {
  id: string;
  /** Sólo existe tras enviar. Siempre con prefijo DEMO- (src/domain/folios.ts). */
  folio: string | null;
  servicioId: string;
  servicioNombre: string;
  identidadId: string;
  tipo: TipoRecorrido;
  estado: EstadoGestion;
  /** Campos capturados (ficticios). Nunca CURP, INE ni comprobantes reales. */
  datos: Record<string, string | number | boolean | null>;
  /** Nombres de campos reutilizados del Expediente Digital con confirmación explícita. */
  camposReutilizados: string[];
  creadaEn: FechaISO;
  actualizadaEn: FechaISO;
  enviadaEn?: FechaISO;
  historial: EventoGestion[];
  pagoId?: string;
  citaId?: string;
}

export interface BorradorGestionInput {
  id?: string;
  servicioId: string;
  identidadId: string;
  tipo: TipoRecorrido;
  datos: Gestion["datos"];
  camposReutilizados?: string[];
}

/** Pago simulado: nunca pide tarjetas reales ni genera comprobantes fiscales. */
export interface PagoDemo {
  id: string;
  /** Referencia DEMO-P-... */
  referencia: string;
  gestionId?: string;
  identidadId: string;
  concepto: string;
  /** Monto ficticio del escenario de demostración. */
  montoDemo: number;
  metodo: "tarjeta_demo" | "referencia_demo";
  estado: "simulado_aprobado" | "simulado_rechazado";
  fecha: FechaISO;
  leyenda: "Pago simulado";
}

export interface CitaDemo {
  id: string;
  /** Referencia DEMO-C-... */
  referencia: string;
  servicioId: string;
  identidadId: string;
  fecha: string;
  hora: string;
  sede: string;
  estado: "solicitud_simulada" | "cancelada";
  creadaEn: FechaISO;
}
