/**
 * Guardas Clef del asistente (portadas de Vital Oceans backend/guards.py y Tricologs clef.ts).
 *
 * - Acción solicitada (noul): sólo para acciones de nivel B. En "shadow" siempre permite pero informa
 *   la probabilidad; en "enforce" pide preguntar si p < 0,3. Sin señal, la app sigue igual.
 * - Intención (choice): señal informativa para la interfaz.
 * Clef nunca autoriza nada: la confirmación en pantalla sigue siendo obligatoria.
 * El registro guarda nombres de acción, modos y probabilidades; nunca texto.
 */
import { ACCIONES, esNombreAccion, validarArgumentos, type NombreAccion } from "../../shared/asistente/acciones";
import {
  CATEGORIAS_INTENCION,
  LIMITES_GUARDAS,
  type CategoriaIntencion,
  type MensajeReciente,
  type ModoGuardas,
  type RespuestaGuardaAccion,
  type RespuestaGuardaIntencion,
} from "../../shared/asistente/servidor";
import type { ClienteClef } from "../proveedores/clef";
import type { Registrador } from "../registro";

const DESCRIPCION_INTENCIONES: Record<CategoriaIntencion, string> = {
  consulta_tramite: "Pregunta por un trámite o servicio municipal: requisitos, costos, horarios, pagos o dónde hacerlo.",
  reporte_ciudadano: "Quiere reportar un problema en la vía pública (bache, luminaria, basura, rejilla, parque) o consultar un reporte.",
  guia_navegacion: "Pide que le muestren dónde está algo en la aplicación, que le abran una sección o cómo se usa una pantalla.",
  bienestar: "Busca apoyo emocional, psicológico, de salud o de atención a mujeres, sin señales de riesgo inmediato.",
  riesgo_o_emergencia: "Hay señales de riesgo: alguien en peligro, violencia, autolesión, ideas de suicidio o una emergencia.",
  conversacion: "Sólo saluda, agradece o platica sin pedir información ni acciones.",
  fuera_de_alcance: "Algo ajeno a los servicios municipales y a la aplicación.",
};

/** Qué haría la acción, en palabras, para que Clef juzgue si la persona la pidió. */
function describirAccion(nombre: NombreAccion, argumentos: unknown): string {
  switch (nombre) {
    case "prepararReporte": {
      const resultado = validarArgumentos("prepararReporte", argumentos);
      const categoria = resultado.ok ? resultado.valor.categoria.replaceAll("_", " ") : "un problema";
      return `abrir el formulario para reportar ${categoria} con datos sugeridos (la persona lo revisa y lo envía)`;
    }
    case "iniciarTramiteDemo":
      return "abrir el formulario simulado de un trámite del catálogo (la persona lo revisa y lo envía)";
    default:
      return ACCIONES[nombre].descripcion;
  }
}

export async function evaluarAccionSolicitada(opciones: {
  clef: ClienteClef;
  modo: ModoGuardas;
  accion: string;
  argumentos: unknown;
  mensajes: readonly MensajeReciente[];
  registrar: Registrador;
}): Promise<RespuestaGuardaAccion> {
  const { clef, modo, accion, argumentos, registrar } = opciones;
  if (!esNombreAccion(accion) || ACCIONES[accion].nivel !== "B") {
    return { probabilidad: null, decision: "sin_senal", modo, aplica: false };
  }
  const recientes = opciones.mensajes.slice(-LIMITES_GUARDAS.mensajes);
  if (modo === "off" || !clef.configurado || !recientes.some((mensaje) => mensaje.rol === "persona")) {
    registrar("guarda_accion", { accion, modo, probabilidad: null, senal: false });
    return { probabilidad: null, decision: "sin_senal", modo, aplica: true };
  }
  const conversacion = recientes
    .map((mensaje) => `${mensaje.rol === "persona" ? "Persona" : "Asistente"}: ${mensaje.texto.slice(0, LIMITES_GUARDAS.caracteresPorMensaje)}`)
    .join("\n");
  const respuestas = await clef.decidir(
    `Conversación reciente:\n${conversacion}\n\nAcción pendiente del asistente: ${describirAccion(accion, argumentos)}.`,
    {
      solicitada: {
        type: "noul",
        instructions: "¿La persona pidió esta acción o respondió que sí cuando se la propusieron?",
      },
    },
  );
  const respuesta = respuestas?.solicitada;
  const probabilidad = respuesta?.type === "noul" ? respuesta.noul : null;
  const preguntaria = probabilidad !== null && probabilidad < LIMITES_GUARDAS.umbralPreguntar;
  registrar("guarda_accion", { accion, modo, probabilidad, preguntaria });
  if (probabilidad === null) return { probabilidad: null, decision: "sin_senal", modo, aplica: true };
  // En shadow sólo se mide: la decisión siempre es permitir (y la confirmación en pantalla sigue).
  const decision = modo === "enforce" && preguntaria ? "preguntar" : "permitir";
  return { probabilidad, decision, modo, aplica: true };
}

export async function clasificarIntencion(opciones: {
  clef: ClienteClef;
  modo: ModoGuardas;
  texto: string;
  registrar: Registrador;
}): Promise<RespuestaGuardaIntencion> {
  const { clef, modo, texto, registrar } = opciones;
  if (modo === "off" || !clef.configurado) return { categoria: null, probabilidades: {}, modo };
  const respuestas = await clef.decidir(
    `Mensaje de una persona al asistente de servicios digitales municipales de Mérida: ${texto.slice(0, LIMITES_GUARDAS.caracteresIntencion)}`,
    {
      categoria: {
        type: "choice",
        instructions: "¿Qué está pidiendo la persona?",
        criteria: DESCRIPCION_INTENCIONES,
      },
    },
  );
  const respuesta = respuestas?.categoria;
  if (respuesta?.type !== "choice") return { categoria: null, probabilidades: {}, modo };
  const categoria = CATEGORIAS_INTENCION.find((opcion) => opcion === respuesta.choice) ?? null;
  const probabilidades: Record<string, number> = {};
  for (const opcion of CATEGORIAS_INTENCION) {
    const valor = respuesta.probabilities[opcion];
    if (typeof valor === "number") probabilidades[opcion] = valor;
  }
  registrar("guarda_intencion", { categoria, probabilidad: categoria ? (probabilidades[categoria] ?? null) : null });
  return { categoria, probabilidades, modo };
}
