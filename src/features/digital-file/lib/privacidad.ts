import type { PreferenciasPrivacidad } from "@/types";

/** Preferencias que la persona puede cambiar. La confirmación antes de reutilizar siempre está activa. */
export type PreferenciaEditable = Exclude<keyof PreferenciasPrivacidad, "confirmarAntesDeReutilizar">;

export interface DefinicionPreferencia {
  clave: PreferenciaEditable;
  etiqueta: string;
  descripcion: string;
  /** data-guia del interruptor. */
  guia: string;
}

export const PREFERENCIAS_EDITABLES: readonly DefinicionPreferencia[] = [
  {
    clave: "asistentePuedeUsarNombre",
    etiqueta: "Pekito puede saludarte por tu nombre",
    descripcion: "Sólo usa tu nombre ficticio. Nunca lee tus documentos ni tus datos de contacto, y no envía nada por ti.",
    guia: "expediente.privacidad_nombre_asistente",
  },
  {
    clave: "notificacionesDiscretas",
    etiqueta: "Notificaciones discretas",
    descripcion: "Las vistas previas ocultan los detalles. Útil si compartes pantalla o usas un equipo público.",
    guia: "expediente.privacidad_notificaciones_discretas",
  },
  {
    clave: "avisosDeVerificacion",
    etiqueta: "Avisos de verificaciones cercanas",
    descripcion: "Te avisamos cuando hay un reporte cerca que puedes verificar. Son avisos ficticios de la demostración.",
    guia: "expediente.privacidad_avisos_verificacion",
  },
];

/** Una notificación muestra su detalle sólo si no es sensible y la persona no pidió vistas discretas. */
export function mostrarDetalleNotificacion(notificacion: { sensible: boolean }, privacidad: Pick<PreferenciasPrivacidad, "notificacionesDiscretas"> | undefined): boolean {
  if (notificacion.sensible) return false;
  // Mientras carga la privacidad, se asume discreción (no se muestra de más).
  if (!privacidad) return false;
  return !privacidad.notificacionesDiscretas;
}
