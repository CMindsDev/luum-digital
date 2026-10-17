import type { ReciboAccion } from "@shared/asistente/acciones";
import type { AccionEnCurso, MensajeConversacion } from "../runtime/store";

/** Sugerencias del inicio del chat (22:218/22:253). Prellenan el compositor; nunca envían solas. */
export const SUGERENCIAS_PEKITO = [
  { etiqueta: "Reportar un bache", texto: "Quiero reportar un bache" },
  { etiqueta: "Requisitos de un trámite", texto: "¿Qué requisitos pide el trámite de " },
  { etiqueta: "Consultar mi folio", texto: "Quiero consultar mi folio" },
  { etiqueta: "Apoyo psicológico", texto: "Busco apoyo psicológico" },
  { etiqueta: "Trámite de mi negocio", texto: "Quiero revisar un trámite de mi negocio" },
  { etiqueta: "Actividades culturales", texto: "Busco actividades culturales" },
] as const;

export type ElementoLinea =
  | { tipo: "mensaje"; clave: string; mensaje: MensajeConversacion }
  | { tipo: "recibo"; clave: string; recibo: ReciboAccion }
  | { tipo: "accion"; clave: string; accion: AccionEnCurso };

/** Intercala recibos y acciones en curso con los mensajes, según su ancla en el historial. */
export function lineaDeTiempo(
  mensajes: readonly MensajeConversacion[],
  recibos: readonly ReciboAccion[],
  acciones: readonly AccionEnCurso[],
  anclas: Readonly<Record<string, number>>,
): ElementoLinea[] {
  const porAncla = new Map<number, ElementoLinea[]>();
  const agregar = (ancla: number, elemento: ElementoLinea) => {
    const posicion = Math.min(Math.max(0, ancla), mensajes.length);
    porAncla.set(posicion, [...(porAncla.get(posicion) ?? []), elemento]);
  };
  for (const recibo of recibos) {
    // Una consulta de información lograda no es un paso que la persona deba ver: la respuesta ya cita sus fuentes.
    if (recibo.accion === "consultarConocimiento" && recibo.estado === "completada") continue;
    agregar(anclas[recibo.llamadaId] ?? mensajes.length, { tipo: "recibo", clave: `r-${recibo.llamadaId}`, recibo });
  }
  for (const accion of acciones) agregar(anclas[accion.llamadaId] ?? mensajes.length, { tipo: "accion", clave: `a-${accion.llamadaId}`, accion });
  const elementos: ElementoLinea[] = [];
  mensajes.forEach((mensaje, indice) => {
    elementos.push(...(porAncla.get(indice) ?? []));
    elementos.push({ tipo: "mensaje", clave: `m-${mensaje.id}`, mensaje });
  });
  elementos.push(...(porAncla.get(mensajes.length) ?? []));
  return elementos;
}
