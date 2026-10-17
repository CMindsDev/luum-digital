/**
 * Bus de actuación (portado de Alex/Marea, alex-act.ts): la sesión avisa a la capa visual tipo
 * Clicky qué está haciendo el asistente en pantalla, para que un cursor guía o un anillo lo muestre.
 * Sólo transporta señales: la acción siempre corre por el ejecutor con handles tipados, nunca
 * simulando clics.
 */
import type { NombreAccion, ReciboAccion } from "@shared/asistente/acciones";

export type EventoActuacion =
  /** El modelo pidió una acción: dónde caerá, antes de ejecutarla (objetivo data-guia visible o null). */
  | { tipo: "intent"; id: string; accion: NombreAccion; objetivo: string | null }
  /** La acción pasó la validación y se ejecuta ahora. */
  | { tipo: "run"; id: string }
  /** Su recibo. Una acción rechazada o fallida termina como "fallida". */
  | { tipo: "done"; id: string; estado: ReciboAccion["estado"] }
  /** senalarElemento: un pulso sobre `objetivo` (data-guia), sin nada que ejecutar. */
  | { tipo: "point"; objetivo: string; etiqueta: string };

export type OyenteActuacion = (evento: EventoActuacion) => void;

const oyentes = new Set<OyenteActuacion>();

export function emitirActuacion(evento: EventoActuacion): void {
  // Un oyente que se da de baja mientras se le avisa no hace que se salten los demás.
  for (const oyente of [...oyentes]) {
    try {
      oyente(evento);
    } catch {
      // La capa visual nunca debe interrumpir la acción.
    }
  }
}

/** Escucha el bus; la función devuelta deja de escuchar. */
export function suscribirActuacion(oyente: OyenteActuacion): () => void {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}
