import type { FechaISO } from "./comunes";

/** Opciones que ve la persona al verificar (brief, sección 11). */
export type ResultadoVerificacion = "reparacion_completada" | "problema_persiste" | "no_puedo_comprobar";

export type EstadoRevision = "pendiente_revision" | "aprobada" | "rechazada" | "revertida";

/** Criterios de calidad de una verificación: se premia la calidad, no la respuesta positiva. */
export interface CalidadVerificacion {
  /** Comentario con información útil (longitud mínima definida en las reglas). */
  descripcionUtil: boolean;
  /** La persona confirmó que observó el punto exacto. */
  ubicacionConfirmada: boolean;
  /** Adjuntó fotografía (no se persiste). */
  evidencia: boolean;
}

export interface Verificacion {
  id: string;
  reporteId: string;
  reporteFolio: string;
  identidadId: string;
  fecha: FechaISO;
  resultado: ResultadoVerificacion;
  comentario: string;
  calidad: CalidadVerificacion;
  estadoRevision: EstadoRevision;
  revisadaPor?: string;
  motivoRevision?: string;
}

export interface NuevaVerificacionInput {
  reporteId: string;
  resultado: ResultadoVerificacion;
  comentario: string;
  ubicacionConfirmada: boolean;
  tieneFoto: boolean;
}

export type TipoMovimiento =
  | "reporte_validado"
  | "verificacion_aprobada"
  | "canje"
  | "reversion"
  | "cancelacion";

/** Sólo los movimientos "aprobado" cuentan en el saldo. */
export type EstadoMovimiento = "pendiente" | "aprobado" | "cancelado" | "revertido";

export interface MovimientoPuntos {
  id: string;
  identidadId: string;
  /** Clave única del evento (idempotencia): p. ej. "reporte:<id>:validado". */
  claveEvento: string;
  tipo: TipoMovimiento;
  /** Positivo para créditos, negativo para canjes y reversiones. */
  puntos: number;
  estado: EstadoMovimiento;
  /** Motivo legible del movimiento (obligatorio). */
  motivo: string;
  fecha: FechaISO;
  referenciaId?: string;
}

export interface SaldoPuntos {
  /** Suma de movimientos aprobados (créditos menos canjes y reversiones). */
  disponible: number;
  /** Créditos en espera de validación simulada: no se pueden canjear. */
  pendientes: number;
  totalCanjeado: number;
}

/** Reglas de demostración, configurables en src/data/reglas-puntos.ts. */
export interface ReglasPuntosDemo {
  etiqueta: "Reglas de demostración";
  reporteValidado: number;
  verificacionBase: number;
  verificacionBonoCalidad: number;
  verificacionNoConcluyente: number;
  longitudMinimaComentario: number;
  /** Las aportaciones a un reporte existente no generan puntos (evita premiar duplicados). */
  aportacion: 0;
  descripcion: string[];
}

/** Beneficio ficticio identificado como ejemplo: no hay patrocinadores ni descuentos reales. */
export interface BeneficioDemo {
  id: string;
  nombre: string;
  descripcion: string;
  costoPuntos: number;
  disponible: boolean;
  ejemplo: true;
}

export interface CanjeDemo {
  id: string;
  /** DEMO-B-... sin validez. */
  codigo: string;
  beneficioId: string;
  beneficioNombre: string;
  identidadId: string;
  puntos: number;
  fecha: FechaISO;
}
