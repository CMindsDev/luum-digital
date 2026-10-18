/**
 * Contrato del asistente en el navegador. Dos proveedores lo implementan:
 * - Demostración (src/features/assistant/providers/demo): respuestas programadas y reproducibles,
 *   etiquetadas como tales. Funciona sin claves ni servidor.
 * - OpenAI Realtime (src/features/assistant/providers/realtime): sesión WebRTC creada por el
 *   servidor (/api/asistente/conexiones); la clave nunca llega al navegador. Portado de Alex/Marea.
 *
 * El proveedor nunca ejecuta acciones: emite eventos "accion" que la app valida, ejecuta con
 * handles tipados y responde con un ReciboAccion.
 */
import type { AmbitoAsistente, NombreAccion, ReciboAccion } from "@shared/asistente/acciones";
import type { PantallaActual } from "@shared/asistente/pantalla";
import type { ExpertoAsistente, ExpertoGeneral } from "@shared/asistente/expertos";

export type ModoAsistente = "demostracion" | "openai_realtime";

export type EstadoSesionAsistente = "inactivo" | "conectando" | "listo" | "pensando" | "escuchando" | "hablando" | "cerrado";

export interface LlamadaAccion {
  llamadaId: string;
  accion: NombreAccion;
  argumentos: unknown;
}

export interface FuenteCitada {
  titulo: string;
  url?: string;
  ruta?: string;
  fechaConsulta?: string;
  estadoDeInformacion?: "verificada" | "pendiente" | "demostracion";
}

export interface AvisoAsistente {
  tono: "critico" | "precaucion" | "info" | "neutral";
  titulo: string;
  detalle?: string;
  accion?: "reintentar" | "escribir" | "reconectar" | "activar_audio";
}

export type EventoAsistente =
  | { tipo: "experto"; experto: ExpertoAsistente }
  | { tipo: "estado"; estado: EstadoSesionAsistente }
  | { tipo: "texto_delta"; mensajeId: string; texto: string }
  | { tipo: "texto_final"; mensajeId: string; texto: string; fuentes?: FuenteCitada[] }
  | { tipo: "transcripcion_usuario"; mensajeId: string; texto: string }
  | { tipo: "accion"; llamada: LlamadaAccion }
  | { tipo: "aviso"; aviso: AvisoAsistente }
  | { tipo: "nivel_voz"; nivel: number };

export interface OpcionesSesion {
  ambito: AmbitoAsistente;
  pantalla: PantallaActual;
  /** Nombre ficticio para saludar, sólo si las preferencias de privacidad lo permiten. */
  nombreParaSaludo?: string;
  experto?: ExpertoGeneral;
}

export interface SesionAsistente {
  readonly ambito: AmbitoAsistente;
  enviarTexto(texto: string): void;
  /** Sólo disponible si el proveedor admite voz. */
  iniciarVoz?(): Promise<void>;
  detenerVoz?(): void;
  actualizarPantalla(pantalla: PantallaActual): void;
  entregarRecibo(recibo: ReciboAccion): void;
  cerrar(): void;
  suscribir(oyente: (evento: EventoAsistente) => void): () => void;
}

export interface AssistantProvider {
  readonly modo: ModoAsistente;
  /** Texto visible: p. ej. "Respuestas programadas (demostración)". */
  readonly etiqueta: string;
  readonly admiteVoz: boolean;
  iniciar(opciones: OpcionesSesion): Promise<SesionAsistente>;
}

/** Respuesta de GET /api/asistente/estado (sin secretos). */
export interface EstadoServidorAsistente {
  realtime: { disponible: boolean; modelo?: string; motivo?: string };
  clef: { disponible: boolean; modo: "off" | "shadow" | "enforce" };
  bienestarIaReal: boolean;
}
