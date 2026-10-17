/**
 * Contrato HTTP del servidor ligero del asistente (server/), compartido por el navegador y el servidor.
 *
 * El navegador nunca recibe claves: sólo envía su oferta SDP y la pantalla acotada, y recibe la
 * respuesta SDP con un identificador propio. Las guardas Clef aportan una señal que nunca autoriza
 * nada: la confirmación en pantalla sigue siendo obligatoria.
 */
import { z } from "zod";
import { PantallaActualSchema } from "./pantalla";

export const RUTAS_API_ASISTENTE = {
  salud: "/api/salud",
  estado: "/api/asistente/estado",
  conexiones: "/api/asistente/conexiones",
  guardaAccion: "/api/asistente/guardas/accion",
  guardaIntencion: "/api/asistente/guardas/intencion",
} as const;

export const MODOS_GUARDAS = ["off", "shadow", "enforce"] as const;
export type ModoGuardas = (typeof MODOS_GUARDAS)[number];

export const LIMITES_GUARDAS = {
  /** Mensajes recientes que se envían a la guarda de acción. */
  mensajes: 6,
  caracteresPorMensaje: 400,
  caracteresIntencion: 1500,
  /** Por debajo de esta probabilidad, en modo enforce, el asistente debe preguntar antes de preparar. */
  umbralPreguntar: 0.3,
} as const;

/** Categorías del clasificador de intención (Clef choice). */
export const CATEGORIAS_INTENCION = [
  "consulta_tramite",
  "reporte_ciudadano",
  "guia_navegacion",
  "bienestar",
  "riesgo_o_emergencia",
  "conversacion",
  "fuera_de_alcance",
] as const;
export type CategoriaIntencion = (typeof CATEGORIAS_INTENCION)[number];

// --- POST /api/asistente/conexiones ---

export const SolicitudConexionSchema = z.object({
  ambito: z.enum(["general", "bienestar"]),
  /** Oferta SDP del navegador (WebRTC). */
  sdp: z
    .string()
    .min(10)
    .max(60_000)
    .refine((valor) => valor.startsWith("v=0"), "La oferta SDP no es válida."),
  pantalla: PantallaActualSchema,
  /** Obligatorio (true) para el ámbito bienestar con IA real. */
  consentimientoBienestar: z.boolean().optional(),
  /** Nombre ficticio para saludar, sólo si las preferencias de privacidad lo permiten. */
  nombreParaSaludo: z.string().max(40).optional(),
});
export type SolicitudConexion = z.infer<typeof SolicitudConexionSchema>;

export const RespuestaConexionSchema = z.object({
  /** Identificador propio y aleatorio (no es el id de la llamada del proveedor). */
  id: z.string().min(1).max(100),
  sdp: z.string().min(1),
  modelo: z.string().min(1),
  maxSegundos: z.number().int().positive(),
});
export type RespuestaConexion = z.infer<typeof RespuestaConexionSchema>;

// --- POST /api/asistente/guardas/accion ---

export const MensajeRecienteSchema = z.object({
  rol: z.enum(["persona", "asistente"]),
  texto: z.string().max(LIMITES_GUARDAS.caracteresPorMensaje),
});
export type MensajeReciente = z.infer<typeof MensajeRecienteSchema>;

export const SolicitudGuardaAccionSchema = z.object({
  accion: z.string().min(1).max(60),
  argumentos: z.unknown(),
  mensajesRecientes: z.array(MensajeRecienteSchema).max(LIMITES_GUARDAS.mensajes),
});
export type SolicitudGuardaAccion = z.infer<typeof SolicitudGuardaAccionSchema>;

export const RespuestaGuardaAccionSchema = z.object({
  /** Probabilidad (0..1) de que la persona pidió la acción; null si no hubo señal. */
  probabilidad: z.number().min(0).max(1).nullable(),
  /** "permitir" no autoriza nada: sólo indica que la guarda no objeta. */
  decision: z.enum(["permitir", "preguntar", "sin_senal"]),
  modo: z.enum(MODOS_GUARDAS),
  /** false si la acción no es de nivel B (la guarda no aplica). */
  aplica: z.boolean(),
});
export type RespuestaGuardaAccion = z.infer<typeof RespuestaGuardaAccionSchema>;

// --- POST /api/asistente/guardas/intencion ---

export const SolicitudGuardaIntencionSchema = z.object({
  texto: z.string().trim().min(1).max(LIMITES_GUARDAS.caracteresIntencion),
});
export type SolicitudGuardaIntencion = z.infer<typeof SolicitudGuardaIntencionSchema>;

export const RespuestaGuardaIntencionSchema = z.object({
  categoria: z.enum(CATEGORIAS_INTENCION).nullable(),
  probabilidades: z.record(z.string(), z.number().min(0).max(1)),
  modo: z.enum(MODOS_GUARDAS),
});
export type RespuestaGuardaIntencion = z.infer<typeof RespuestaGuardaIntencionSchema>;

// --- GET /api/asistente/estado (compatible con EstadoServidorAsistente de src/services/contracts) ---

export const EstadoServidorSchema = z.object({
  realtime: z.object({
    disponible: z.boolean(),
    modelo: z.string().optional(),
    motivo: z.string().optional(),
  }),
  clef: z.object({ disponible: z.boolean(), modo: z.enum(MODOS_GUARDAS) }),
  bienestarIaReal: z.boolean(),
});
export type EstadoServidor = z.infer<typeof EstadoServidorSchema>;

/** Cuerpo de error del servidor: mensaje legible en español y código estable, nunca detalles internos. */
export const ErrorServidorSchema = z.object({
  error: z.string(),
  codigo: z.string().optional(),
  reintentarEnSegundos: z.number().optional(),
});
export type ErrorServidor = z.infer<typeof ErrorServidorSchema>;

export const CODIGOS_ERROR = {
  solicitudInvalida: "solicitud_invalida",
  pantallaInvalida: "pantalla_invalida",
  origenNoPermitido: "origen_no_permitido",
  cuerpoGrande: "cuerpo_demasiado_grande",
  tipoContenido: "tipo_contenido",
  sinConfiguracion: "sin_configuracion",
  sinCreditos: "sin_creditos",
  ocupado: "ocupado",
  limite: "limite_por_hora",
  proveedor: "proveedor",
  bienestarDesactivado: "bienestar_ia_desactivada",
  consentimientoRequerido: "consentimiento_requerido",
  noEncontrada: "no_encontrada",
  interno: "interno",
} as const;
export type CodigoError = (typeof CODIGOS_ERROR)[keyof typeof CODIGOS_ERROR];
