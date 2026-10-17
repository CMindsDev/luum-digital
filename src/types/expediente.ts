import type { FechaISO } from "./comunes";

/** Perfil ficticio del Expediente Digital del prototipo. Nunca se piden CURP, INE ni comprobantes reales. */
export interface PerfilDemo {
  identidadId: string;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  domicilio: {
    calle: string;
    numero: string;
    colonia: string;
    codigoPostal: string;
  };
  leyenda: "Datos ficticios de demostración";
}

export type TipoDocumentoDemo =
  | "identificacion_ejemplo"
  | "comprobante_domicilio_ejemplo"
  | "constancia_ejemplo"
  | "recibo_simulado";

export interface DocumentoDemo {
  id: string;
  identidadId: string;
  titulo: string;
  tipo: TipoDocumentoDemo;
  fecha: FechaISO;
  /** Texto de la vista previa; siempre incluye la marca "DOCUMENTO DE EJEMPLO". */
  vistaPrevia: string[];
  /** Gestiones relacionadas (ids). */
  gestionesRelacionadas: string[];
}

/** Campo del perfil que puede reutilizarse en un formulario, previa confirmación. */
export interface CampoReutilizable {
  campo: "nombreCompleto" | "correo" | "telefono" | "calle" | "numero" | "colonia" | "codigoPostal";
  etiqueta: string;
  valor: string;
}

export interface PreferenciasPrivacidad {
  /** Pedir confirmación antes de reutilizar datos del expediente (siempre activo en el prototipo). */
  confirmarAntesDeReutilizar: true;
  /** El asistente general puede leer el nombre para saludar. */
  asistentePuedeUsarNombre: boolean;
  /** Notificaciones con vista previa discreta (sin detalles sensibles). */
  notificacionesDiscretas: boolean;
  /** Recibir avisos de verificaciones cercanas (ficticio). */
  avisosDeVerificacion: boolean;
}
