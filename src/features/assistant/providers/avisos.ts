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
    titulo: "No pude conectarme ahora",
    detalle: "Inténtalo de nuevo en un momento o escríbeme.",
  },
  sin_creditos: {
    tono: "precaucion",
    titulo: "No pude conectarme ahora",
    detalle: "Inténtalo de nuevo en un momento o escríbeme.",
    accion: "reintentar",
  },
  ocupado: {
    tono: "precaucion",
    titulo: "Estoy atendiendo varias conversaciones",
    detalle: "Inténtalo de nuevo en un momento.",
    accion: "reintentar",
  },
  limite: {
    tono: "precaucion",
    titulo: "Por ahora no puedo abrir otra conversación",
    detalle: "Inténtalo más tarde.",
  },
  bienestar_desactivado: {
    tono: "info",
    titulo: "En Bienestar la voz no está disponible ahora",
    detalle: "Si quieres, puedo mostrarte ayuda humana.",
  },
  consentimiento: {
    tono: "info",
    titulo: "Antes de continuar",
    detalle: "Acepta el aviso para seguir en Bienestar.",
  },
  conexion_fallida: {
    tono: "critico",
    titulo: "No pude conectarme ahora",
    detalle: "Inténtalo de nuevo en un momento o escríbeme.",
    accion: "reintentar",
  },
  red_cortada: {
    tono: "critico",
    titulo: "Se perdió la conexión",
    detalle: "Inténtalo de nuevo o escríbeme.",
    accion: "reconectar",
  },
  tiempo_agotado: {
    tono: "precaucion",
    titulo: "La conexión tardó demasiado",
    detalle: "Inténtalo de nuevo o escríbeme.",
    accion: "reintentar",
  },
  tiempo_maximo: {
    tono: "info",
    titulo: "La llamada terminó",
    detalle: "Puedes iniciar otra cuando quieras.",
    accion: "reconectar",
  },
  microfono_bloqueado: {
    tono: "precaucion",
    titulo: "No pude usar el micrófono",
    detalle: "Permítelo en tu navegador o escríbeme.",
    accion: "escribir",
  },
  microfono_no_disponible: {
    tono: "precaucion",
    titulo: "La voz no está disponible ahora",
    detalle: "Puedes escribirme.",
    accion: "escribir",
  },
  audio_bloqueado: {
    tono: "precaucion",
    titulo: "Activa el audio",
    detalle: "Tu navegador bloqueó el sonido. Toca «Activar audio» para escucharme.",
    accion: "activar_audio",
  },
  respuesta_fallida: {
    tono: "precaucion",
    titulo: "No pude terminar la respuesta",
    detalle: "Inténtalo de nuevo.",
    accion: "reintentar",
  },
  accion_fallida: {
    tono: "precaucion",
    titulo: "No pude completar eso",
    detalle: "Puedes intentarlo de nuevo.",
  },
};

export function aviso(tipo: TipoAviso, detalle?: string): AvisoAsistente {
  const base = AVISOS[tipo];
  return detalle ? { ...base, detalle } : { ...base };
}

/** Aviso para un código de error del servidor (/api/asistente/*). */
export function avisoPorCodigo(codigo: string | undefined, detalleServidor?: string): AvisoAsistente {
  void detalleServidor;
  switch (codigo) {
    case CODIGOS_ERROR.sinConfiguracion:
      return aviso("sin_configuracion");
    case CODIGOS_ERROR.sinCreditos:
      return aviso("sin_creditos");
    case CODIGOS_ERROR.ocupado:
      return aviso("ocupado");
    case CODIGOS_ERROR.limite:
      return aviso("limite");
    case CODIGOS_ERROR.bienestarDesactivado:
      return aviso("bienestar_desactivado");
    case CODIGOS_ERROR.consentimientoRequerido:
      return aviso("consentimiento");
    default:
      return aviso("conexion_fallida");
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
