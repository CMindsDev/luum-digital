/** Texto breve para el estado de conexión cuando vale la pena mostrarlo. */
import type { EstadoSesionAsistente } from "@/services/contracts";

export type TonoModo = "demo" | "real" | "pendiente";

export interface EtiquetaModo {
  texto: string;
  tono: TonoModo;
}

export function etiquetaDeModo(proveedor: "demo" | "realtime", estadoSesion: EstadoSesionAsistente): EtiquetaModo {
  if (estadoSesion === "conectando") return { texto: "Conectando…", tono: "pendiente" };
  return { texto: "", tono: proveedor === "realtime" ? "real" : "demo" };
}
