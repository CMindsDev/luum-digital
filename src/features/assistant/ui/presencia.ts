/**
 * Presencia mínima de Pekito (portada de Alex/Marea, alex-presence.ts y alex-capsule.ts): una
 * mascota pequeña que se estira en una píldora de UNA línea sólo cuando hay algo que decir o hacer.
 * Todo aquí es puro: la interfaz deriva qué mostrar a partir del estado del asistente.
 */
import type { EstadoSesionAsistente } from "@/services/contracts";
import type { AccionEnCurso, AvisoVisible, MensajeConversacion } from "../runtime/store";

/** Cuánto dura cada línea temporal en la píldora. */
export const TIEMPOS_PRESENCIA = {
  /** Una respuesta de texto se queda este tiempo sin atención y luego se repliega. */
  respuestaMs: 12_000,
  /** Un aviso ocupa la línea este tiempo (el historial conserva el aviso completo). */
  avisoMs: 6_000,
} as const;

/** Máximo de caracteres que lee la línea (la vista la recorta a una sola línea). */
export const MAX_LINEA = 140;

export type TipoLinea = "accion" | "aviso" | "conectando" | "pensando" | "escuchando" | "hablando" | "respuesta";

export interface LineaPresencia {
  tipo: TipoLinea;
  texto: string;
  /** La línea pertenece a una llamada de voz (la píldora ofrece «Colgar»). */
  enLlamada: boolean;
}

export interface EntradaPresencia {
  panelAbierto: boolean;
  estadoSesion: EstadoSesionAsistente;
  vozActiva: boolean;
  accionesEnCurso: readonly AccionEnCurso[];
  avisos: readonly AvisoVisible[];
  mensajes: readonly MensajeConversacion[];
  /** Id del último mensaje del asistente que la persona ya vio (o descartó). */
  mensajeVisto: string | null;
  /** Id del último aviso que ya se mostró el tiempo suficiente (o se descartó). */
  avisoVisto: string | null;
}

/** Primera oración (o el inicio) de un texto, en una línea y acotada. */
export function resumirLinea(texto: string, maximo: number = MAX_LINEA): string {
  const plano = texto.replace(/\s+/g, " ").trim();
  const oracion = /^(.+?[.!?])(\s|$)/.exec(plano)?.[1] ?? plano;
  const caracteres = Array.from(oracion);
  return caracteres.length > maximo ? `${caracteres.slice(0, maximo - 1).join("").trimEnd()}…` : oracion;
}

/** Cola de los subtítulos: las últimas palabras de lo que dice el asistente. */
export function colaSubtitulo(texto: string, maximo: number = 90): string {
  const plano = texto.replace(/\s+/g, " ").trim();
  const caracteres = Array.from(plano);
  if (caracteres.length <= maximo) return plano;
  const cola = caracteres.slice(caracteres.length - maximo).join("");
  const corte = cola.indexOf(" ");
  return `…${corte > 0 && corte < 20 ? cola.slice(corte + 1) : cola}`;
}

export function ultimoMensajeAsistente(mensajes: readonly MensajeConversacion[]): MensajeConversacion | null {
  for (let indice = mensajes.length - 1; indice >= 0; indice -= 1) {
    const mensaje = mensajes[indice];
    if (mensaje?.rol === "asistente" && mensaje.texto.trim()) return mensaje;
  }
  return null;
}

/**
 * Qué dice la píldora ahora (null = sólo la mascota). Las reglas anteriores ganan: una acción en
 * pantalla, luego un aviso, luego la voz, luego «pensando» y al final la última respuesta sin ver.
 * Con el panel abierto no hay línea: la conversación ya está a la vista.
 */
export function describirPresencia(entrada: EntradaPresencia): LineaPresencia | null {
  if (entrada.panelAbierto) return null;
  const enLlamada = entrada.vozActiva;

  const accion = entrada.accionesEnCurso.at(-1);
  if (accion) return { tipo: "accion", texto: accion.estadoTexto, enLlamada };

  const aviso = entrada.avisos.at(-1);
  if (aviso && aviso.id !== entrada.avisoVisto) return { tipo: "aviso", texto: resumirLinea(aviso.titulo), enLlamada };

  if (entrada.vozActiva) {
    if (entrada.estadoSesion === "hablando") {
      const ultimo = ultimoMensajeAsistente(entrada.mensajes);
      return { tipo: "hablando", texto: ultimo ? colaSubtitulo(ultimo.texto) : "Pekito está hablando", enLlamada };
    }
    if (entrada.estadoSesion === "pensando") return { tipo: "pensando", texto: "Pensando…", enLlamada };
    if (entrada.estadoSesion === "conectando") return { tipo: "conectando", texto: "Conectando…", enLlamada };
    return { tipo: "escuchando", texto: "Te escucho", enLlamada };
  }

  if (entrada.estadoSesion === "conectando") return { tipo: "conectando", texto: "Conectando…", enLlamada };
  if (entrada.estadoSesion === "pensando") return { tipo: "pensando", texto: "Pensando…", enLlamada };

  const ultimo = ultimoMensajeAsistente(entrada.mensajes);
  if (ultimo && !ultimo.pendiente && ultimo.id !== entrada.mensajeVisto) {
    return { tipo: "respuesta", texto: resumirLinea(ultimo.texto), enLlamada };
  }
  return null;
}
