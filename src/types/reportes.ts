import type { Coordenadas, FechaISO } from "./comunes";

/**
 * Tipos de reporte con los nombres de Mérida Móvil ("Selecciona un servicio").
 * Fuente: fichas de tienda de Mérida Móvil v4.0.2, consultadas el 2026-10-17.
 */
export type CategoriaReporte =
  | "bache"
  | "luminaria"
  | "desazolve_rejilla"
  | "basura_via_publica"
  | "animal_muerto"
  | "parques_jardines"
  | "recoleccion_basura";

/** Estado municipal (lo que informa el Ayuntamiento). Etiquetas de "Mis reportes" en Mérida Móvil. */
export type EstadoMunicipal =
  /** "Registrado" */
  | "registrado"
  /** "En proceso de atención" (tras validación del operador) */
  | "en_proceso"
  /** "Solucionado": atención reportada por el Ayuntamiento; no implica verificación ciudadana. */
  | "solucionado"
  /** "Motivo de cancelación" */
  | "cancelado";

export type MotivoCancelacion = "duplicado" | "no_procede" | "fuera_de_competencia" | "informacion_insuficiente";

/** Resultado de la verificación ciudadana, independiente del estado municipal. */
export type EstadoVerificacionCiudadana =
  /** Aún no hay atención reportada que verificar. */
  | "no_aplica"
  /** Hay atención reportada y nadie ha verificado. */
  | "pendiente"
  /** Una verificación aprobada dice que la reparación parece completada. */
  | "coincide"
  /** Una verificación aprobada dice que el problema persiste. */
  | "discrepancia"
  /** Verificaciones aprobadas que no pudieron comprobarlo. */
  | "no_concluyente";

export interface Ubicacion extends Coordenadas {
  /** Calle, cruzamientos o referencia escrita por la persona. */
  referencia: string;
  colonia?: string;
  /** Cómo se obtuvo: el permiso de geolocalización sólo se pide tras una acción explícita. */
  origen: "mapa" | "manual" | "dispositivo";
}

export interface EventoReporte {
  fecha: FechaISO;
  tipo:
    | "asignado"
    | "contacto_simulado"
    | "creado"
    | "aportacion"
    | "validado"
    | "atencion_registrada"
    | "cancelado"
    | "verificacion_recibida"
    | "verificacion_aprobada"
    | "verificacion_rechazada"
    | "verificacion_revertida";
  descripcion: string;
  actor: "ciudadania" | "operador" | "sistema_demo";
}

/** Información adicional aportada a un reporte existente (posible duplicado). No genera reporte nuevo. */
export interface Aportacion {
  id: string;
  identidadId: string;
  fecha: FechaISO;
  descripcion: string;
  tieneFoto: boolean;
}

/** Sugerencias de la asistencia (reglas locales en modo demo). Siempre se etiquetan como simuladas. */
export interface AsistenciaReporte {
  categoriaSugerida?: CategoriaReporte;
  resumen?: string;
  faltantes: string[];
  origen: "reglas_demo" | "ia";
}

export interface Reporte {
  id: string;
  /** DEMO-R-####### (src/domain/folios.ts). */
  folio: string;
  categoria: CategoriaReporte;
  descripcion: string;
  ubicacion: Ubicacion;
  /** La foto no se persiste: sólo se registra que se adjuntó una. */
  tieneFoto: boolean;
  /** Riesgo declarado por la persona (criterio explícito de prioridad). */
  riesgoDeclarado: boolean;
  identidadId: string;
  creadoEn: FechaISO;
  actualizadoEn: FechaISO;
  estadoMunicipal: EstadoMunicipal;
  motivoCancelacion?: MotivoCancelacion;
  verificacion: EstadoVerificacionCiudadana;
  historial: EventoReporte[];
  aportaciones: Aportacion[];
  asistencia?: AsistenciaReporte;
  /** Reporte de semilla (datos ficticios iniciales). */
  semilla?: boolean;
  equipoAsignado?: string;
}

export interface NuevoReporteInput {
  categoria: CategoriaReporte;
  descripcion: string;
  ubicacion: Ubicacion;
  tieneFoto: boolean;
  riesgoDeclarado: boolean;
  asistencia?: AsistenciaReporte;
}

export interface PosibleDuplicado {
  reporte: Reporte;
  distanciaMetros: number;
  motivo: string;
}

export interface FiltroReportes {
  categorias?: CategoriaReporte[];
  estados?: EstadoMunicipal[];
  identidadId?: string;
  desde?: string;
  hasta?: string;
  folio?: string;
}
