import type { FechaISO } from "./comunes";

export interface Notificacion {
  id: string;
  identidadId: string;
  fecha: FechaISO;
  tipo: "gestion" | "reporte" | "verificacion" | "puntos" | "sistema";
  titulo: string;
  cuerpo: string;
  /** Ruta interna relacionada. */
  enlace?: string;
  leida: boolean;
  /**
   * Si es sensible, la vista previa no muestra el detalle (pantallas compartidas).
   * Bienestar, salud mental y Línea Mujer nunca generan notificaciones.
   */
  sensible: boolean;
}
