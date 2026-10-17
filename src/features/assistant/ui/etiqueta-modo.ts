/**
 * Etiqueta SIEMPRE visible del modo del asistente. Nunca presenta las respuestas programadas como
 * IA real, y sólo dice «Conectado» cuando la sesión real está abierta.
 */
import type { EstadoSesionAsistente } from "@/services/contracts";
import { ETIQUETA_DEMO } from "../providers/demo/DemoAssistantProvider";

export type TonoModo = "demo" | "real" | "pendiente";

export interface EtiquetaModo {
  texto: string;
  tono: TonoModo;
}

const CONECTADO: readonly EstadoSesionAsistente[] = ["listo", "pensando", "escuchando", "hablando"];

export function etiquetaDeModo(proveedor: "demo" | "realtime", estadoSesion: EstadoSesionAsistente): EtiquetaModo {
  if (proveedor === "demo") return { texto: ETIQUETA_DEMO, tono: "demo" };
  if (CONECTADO.includes(estadoSesion)) return { texto: "Conectado a OpenAI Realtime", tono: "real" };
  if (estadoSesion === "conectando") return { texto: "Conectando con OpenAI Realtime…", tono: "pendiente" };
  return { texto: "OpenAI Realtime (sin conectar)", tono: "pendiente" };
}
