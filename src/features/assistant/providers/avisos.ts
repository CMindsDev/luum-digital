/**
 * Avisos legibles del asistente (taxonomía portada de Alex/Marea, alex-notice.ts): un título
 * amable, un detalle y, si sirve, una acción. Nunca muestran detalles internos del proveedor.
 */
import { CODIGOS_ERROR } from "@shared/asistente/servidor";
import type { AvisoAsistente } from "@/services/contracts";

export type TipoAviso =
  | "sin_configuracion"
  | "sin_creditos"
  | "ocupado"
  | "limite"
  | "bienestar_desactivado"
  | "consentimiento"
  | "conexion_fallida"
  | "red_cortada"
  | "tiempo_agotado"
  | "tiempo_maximo"
  | "microfono_bloqueado"
  | "microfono_no_disponible"
  | "audio_bloqueado"
  | "respuesta_fallida"
  | "accion_fallida";

const AVISOS: Record<TipoAviso, AvisoAsistente> = {
  sin_configuracion: {
    tono: "neutral",
    titulo: "La IA no está configurada en este servidor",
    detalle: "Puedes seguir con las respuestas programadas de demostración.",
  },
  sin_creditos: {
    tono: "precaucion",
    titulo: "La IA no está disponible ahora",
    detalle: "Puedes seguir sin ella; tu avance se conserva.",
    accion: "reintentar",
  },
  ocupado: {
    tono: "precaucion",
    titulo: "El asistente está atendiendo a muchas personas",
    detalle: "Vuelve a intentarlo en un minuto.",
    accion: "reintentar",
  },
  limite: {
    tono: "precaucion",
    titulo: "Límite de conversaciones por hora",
    detalle: "Puedes seguir con las respuestas programadas y volver a intentarlo más tarde.",
  },
  bienestar_desactivado: {
    tono: "info",
    titulo: "La IA real está desactivada en Bienestar",
    detalle: "Puedes usar el acompañante con respuestas programadas.",
  },
  consentimiento: {
    tono: "info",
    titulo: "Falta tu consentimiento",
    detalle: "Para conversar con IA real en Bienestar acepta antes el aviso de consentimiento.",
  },
  conexion_fallida: {
    tono: "critico",
    titulo: "No pudimos conectar con el asistente",
    detalle: "Tu avance se conserva. Inténtalo de nuevo.",
    accion: "reintentar",
  },
  red_cortada: {
    tono: "critico",
    titulo: "Se cortó la conexión",
    detalle: "Puedes reconectar o seguir escribiendo con las respuestas programadas.",
    accion: "reconectar",
  },
  tiempo_agotado: {
    tono: "precaucion",
    titulo: "La conexión tardó demasiado",
    detalle: "Inténtalo de nuevo.",
    accion: "reintentar",
  },
  tiempo_maximo: {
    tono: "info",
    titulo: "Se terminó el tiempo de la conversación",
    detalle: "Puedes iniciar otra cuando quieras.",
    accion: "reconectar",
  },
  microfono_bloqueado: {
    tono: "precaucion",
    titulo: "Micrófono bloqueado",
    detalle: "Permite el micrófono en tu navegador o sigue escribiendo.",
    accion: "escribir",
  },
  microfono_no_disponible: {
    tono: "precaucion",
    titulo: "El micrófono no está disponible",
    detalle: "La voz necesita HTTPS o localhost y un micrófono. Puedes seguir escribiendo.",
    accion: "escribir",
  },
  audio_bloqueado: {
    tono: "precaucion",
    titulo: "Activa el audio del asistente",
    detalle: "Tu navegador bloqueó el sonido. Toca «Activar audio» para escucharlo.",
    accion: "activar_audio",
  },
  respuesta_fallida: {
    tono: "precaucion",
    titulo: "El asistente no pudo terminar la respuesta",
    detalle: "Inténtalo de nuevo.",
    accion: "reintentar",
  },
  accion_fallida: {
    tono: "precaucion",
    titulo: "No se pudo completar esa solicitud",
    detalle: "Puedes intentarlo de nuevo.",
  },
};

export function aviso(tipo: TipoAviso, detalle?: string): AvisoAsistente {
  const base = AVISOS[tipo];
  return detalle ? { ...base, detalle } : { ...base };
}

/** Aviso para un código de error del servidor (/api/asistente/*). */
export function avisoPorCodigo(codigo: string | undefined, detalleServidor?: string): AvisoAsistente {
  switch (codigo) {
    case CODIGOS_ERROR.sinConfiguracion:
      return aviso("sin_configuracion", detalleServidor);
    case CODIGOS_ERROR.sinCreditos:
      return aviso("sin_creditos", detalleServidor);
    case CODIGOS_ERROR.ocupado:
      return aviso("ocupado", detalleServidor);
    case CODIGOS_ERROR.limite:
      return aviso("limite", detalleServidor);
    case CODIGOS_ERROR.bienestarDesactivado:
      return aviso("bienestar_desactivado", detalleServidor);
    case CODIGOS_ERROR.consentimientoRequerido:
      return aviso("consentimiento", detalleServidor);
    default:
      return aviso("conexion_fallida", detalleServidor);
  }
}

/** Error con un aviso listo para mostrar. */
export class ErrorAsistente extends Error {
  readonly aviso: AvisoAsistente;
  readonly codigo: string | undefined;
  constructor(avisoAsistente: AvisoAsistente, codigo?: string) {
    super(avisoAsistente.detalle ? `${avisoAsistente.titulo}. ${avisoAsistente.detalle}` : avisoAsistente.titulo);
    this.name = "ErrorAsistente";
    this.aviso = avisoAsistente;
    this.codigo = codigo;
  }
}
