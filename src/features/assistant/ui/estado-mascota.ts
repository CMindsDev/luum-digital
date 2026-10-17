/**
 * Estado visual de la mascota de Pekito. Es PURO: a partir del estado del asistente decide qué
 * animación mostrar. Los momentos breves («feliz» tras una acción lista, «triste» tras un error) los
 * resuelve el hook `useEstadoMascota`; aquí sólo se priorizan.
 */
import type { EstadoSesionAsistente } from "@/services/contracts";
import type { AccionEnCurso, MensajeConversacion } from "../runtime/store";

export const ESTADOS_MASCOTA = [
  "reposo",
  "saludando",
  "conectando",
  "escuchando",
  "silenciado",
  "pensando",
  "trabajando",
  "hablando",
  "feliz",
  "triste",
] as const;

export type EstadoMascota = (typeof ESTADOS_MASCOTA)[number];

export interface EntradaEstadoMascota {
  estadoSesion: EstadoSesionAsistente;
  vozActiva: boolean;
  /** Micrófono silenciado durante una llamada. */
  silenciado?: boolean;
  accionesEnCurso: readonly Pick<AccionEnCurso, "llamadaId">[];
  mensajes: readonly Pick<MensajeConversacion, "rol" | "pendiente">[];
  /** Momento breve vigente (lo decide el hook con temporizadores). */
  momento?: "feliz" | "triste" | null;
}

/**
 * Prioridad: error reciente > actuando en pantalla > hablando (voz o texto que llega) > pensando >
 * conectando > silenciado > escuchando > feliz > reposo. Un error siempre se nota; la alegría nunca
 * tapa que Pekito esté trabajando o hablando.
 */
export function derivarEstadoMascota(entrada: EntradaEstadoMascota): EstadoMascota {
  if (entrada.momento === "triste") return "triste";
  if (entrada.accionesEnCurso.length > 0) return "trabajando";

  const ultimo = entrada.mensajes.at(-1);
  const respondiendo = ultimo?.rol === "asistente" && ultimo.pendiente;
  if (entrada.estadoSesion === "hablando" || respondiendo) return "hablando";
  if (entrada.estadoSesion === "pensando") return "pensando";
  if (entrada.estadoSesion === "conectando") return "conectando";

  if (entrada.vozActiva) return entrada.silenciado ? "silenciado" : "escuchando";
  if (entrada.momento === "feliz") return "feliz";
  return "reposo";
}
