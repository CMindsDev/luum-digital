/**
 * Registro único de acciones del asistente (lista blanca), compartido por el navegador y el servidor.
 *
 * Patrón portado de Alex/Marea (Vital Oceans: acciones tipadas con niveles de autonomía y comprobantes)
 * y de Tricobot (Tricologs: registro con zod revalidado y "preparar -> confirmar").
 *
 * - El servidor usa `definicionesParaModelo()` para declarar las herramientas de la sesión Realtime.
 * - El navegador valida los argumentos con el mismo esquema, ejecuta la acción con handles tipados
 *   (nunca simulando clics) y devuelve un recibo. El asistente sólo dice que algo ocurrió si el
 *   recibo dice "completada".
 * - Ninguna acción envía formularios, aprueba puntos, cambia estados administrativos ni lee
 *   conversaciones de salud mental.
 */
import { z } from "zod";

export const NIVELES_AUTONOMIA = {
  A: "Reversible: basta con pedirlo (abrir, buscar, señalar, navegar).",
  B: "Prepara algo que la persona revisa y confirma en pantalla. Nunca envía por su cuenta.",
  C: "Sólo abre una confirmación existente; la decisión siempre es un toque de la persona.",
} as const;

export type NivelAutonomia = keyof typeof NIVELES_AUTONOMIA;

/** Ámbitos aislados: el asistente general nunca recibe ni resume el contenido de bienestar. */
export type AmbitoAsistente = "general" | "bienestar";

const categoriaReporte = z.enum([
  "bache",
  "luminaria",
  "desazolve_rejilla",
  "basura_via_publica",
  "animal_muerto",
  "parques_jardines",
  "recoleccion_basura",
]);

const servicioId = z.string().min(1).max(120);

export const SECCIONES = [
  "inicio",
  "servicios",
  "reportes",
  "mis_reportes",
  "mapa",
  "bienestar",
  "salud_mental",
  "linea_mujer",
  "participacion",
  "expediente",
  "gestiones",
  "notificaciones",
  "cuenta",
] as const;

export type Seccion = (typeof SECCIONES)[number];

interface DefinicionAccion {
  nivel: NivelAutonomia;
  ambitos: readonly AmbitoAsistente[];
  /** Descripción para el modelo: qué hace y qué NO hace. */
  descripcion: string;
  /** Texto breve para la interfaz mientras se ejecuta. */
  estado: string;
  argumentos: z.ZodObject;
}

export const ACCIONES = {
  buscarServicios: {
    nivel: "A",
    ambitos: ["general"],
    descripcion:
      "Busca en el Catálogo Municipal integrado del prototipo y muestra los resultados en pantalla. Devuelve hasta 5 servicios con id, nombre, estado de información y fuente. No inventes servicios que no devuelva.",
    estado: "Buscando en el catálogo…",
    argumentos: z.object({ consulta: z.string().min(2).max(120) }),
  },
  consultarConocimiento: {
    nivel: "A",
    ambitos: ["general"],
    descripcion:
      "Consulta la base de conocimiento verificada de la plataforma: las áreas y dependencias del Ayuntamiento de Mérida (cuántas hay, de qué tipo y cuáles son), los trámites y servicios con su área, requisitos, costos, pasos y canales, y cómo usar la plataforma. Úsala SIEMPRE antes de responder cualquier pregunta de datos sobre el Ayuntamiento o la plataforma, también para conteos y listas. Devuelve hasta 5 pasajes con su fuente. Responde SÓLO con lo que devuelvan los pasajes; si no devuelve nada o no contesta la pregunta, di que no tienes esa información. No abre pantallas.",
    estado: "Consultando información…",
    argumentos: z.object({ consulta: z.string().min(2).max(200) }),
  },
  abrirServicio: {
    nivel: "A",
    ambitos: ["general"],
    descripcion: "Abre la ficha interna de un servicio del catálogo por su id.",
    estado: "Abriendo la ficha…",
    argumentos: z.object({ servicioId }),
  },
  consultarRequisitos: {
    nivel: "A",
    ambitos: ["general"],
    descripcion:
      "Abre la ficha en la sección de requisitos y devuelve los requisitos con su fuente y fecha. Si están pendientes de verificar, dilo así; nunca completes requisitos, costos ni horarios por tu cuenta.",
    estado: "Consultando requisitos…",
    argumentos: z.object({ servicioId }),
  },
  prepararReporte: {
    nivel: "B",
    ambitos: ["general"],
    descripcion:
      "Abre el formulario de reporte (por ejemplo «Bache a la vista») con la categoría y una descripción sugeridas. No envía nada: la persona revisa, confirma la ubicación y envía.",
    estado: "Preparando el reporte…",
    argumentos: z.object({
      categoria: categoriaReporte,
      descripcion: z.string().max(300).optional(),
      referenciaUbicacion: z.string().max(160).optional(),
    }),
  },
  consultarReporte: {
    nivel: "A",
    ambitos: ["general"],
    descripcion: "Abre «Mis reportes» o el detalle de un reporte por su folio DEMO. Nunca inventes folios.",
    estado: "Consultando el reporte…",
    argumentos: z.object({ folio: z.string().max(24).optional() }),
  },
  abrirMapa: {
    nivel: "A",
    ambitos: ["general"],
    descripcion: "Abre el Visor Urbano del prototipo con filtros de incidencias de demostración.",
    estado: "Abriendo el mapa…",
    argumentos: z.object({
      categoria: categoriaReporte.optional(),
      vista: z.enum(["puntos", "calor", "celdas", "lista"]).optional(),
      reporteId: z.string().max(60).optional(),
    }),
  },
  consultarGestionesDemo: {
    nivel: "A",
    ambitos: ["general"],
    descripcion: "Abre «Mis gestiones» y devuelve un resumen de las gestiones simuladas de la identidad activa.",
    estado: "Revisando tus gestiones…",
    argumentos: z.object({}),
  },
  iniciarTramiteDemo: {
    nivel: "B",
    ambitos: ["general"],
    descripcion:
      "Abre el formulario simulado de un trámite del catálogo. No lo envía: la persona revisa y confirma. Si la persona quiere reutilizar datos de su expediente, la app pide confirmación aparte.",
    estado: "Abriendo el formulario…",
    argumentos: z.object({ servicioId }),
  },
  explicarBeneficiosDemo: {
    nivel: "A",
    ambitos: ["general"],
    descripcion:
      "Abre «Participación y recompensas» y devuelve las reglas de demostración y el saldo. No apruebes puntos ni prometas descuentos reales.",
    estado: "Abriendo recompensas…",
    argumentos: z.object({}),
  },
  mostrarApoyoHumano: {
    nivel: "A",
    ambitos: ["general", "bienestar"],
    descripcion:
      "Muestra de inmediato los canales de ayuda humana verificados. Úsala ante cualquier señal de riesgo sin esperar a terminar la conversación.",
    estado: "Mostrando ayuda humana…",
    argumentos: z.object({ motivo: z.enum(["salud_mental", "violencia", "emergencia", "orientacion"]) }),
  },
  navegar: {
    nivel: "A",
    ambitos: ["general"],
    descripcion: "Abre una sección de la aplicación.",
    estado: "Abriendo la sección…",
    argumentos: z.object({ seccion: z.enum(SECCIONES) }),
  },
  senalarElemento: {
    nivel: "A",
    ambitos: ["general", "bienestar"],
    descripcion:
      "Señala con el cursor guía un control visible. Sólo acepta ids que aparezcan en «[Pantalla actual]».",
    estado: "Señalando…",
    argumentos: z.object({ objetivo: z.string().min(1).max(80) }),
  },
} as const satisfies Record<string, DefinicionAccion>;

export type NombreAccion = keyof typeof ACCIONES;

export type ArgumentosAccion<N extends NombreAccion> = z.infer<(typeof ACCIONES)[N]["argumentos"]>;

export const NOMBRES_ACCIONES = Object.keys(ACCIONES) as NombreAccion[];

export function esNombreAccion(valor: string): valor is NombreAccion {
  return Object.hasOwn(ACCIONES, valor);
}

export function accionesDelAmbito(ambito: AmbitoAsistente): NombreAccion[] {
  return NOMBRES_ACCIONES.filter((nombre) => (ACCIONES[nombre].ambitos as readonly AmbitoAsistente[]).includes(ambito));
}

/** Valida argumentos con el esquema del registro. Nunca lanza: devuelve el error legible. */
export function validarArgumentos<N extends NombreAccion>(
  nombre: N,
  argumentos: unknown,
): { ok: true; valor: ArgumentosAccion<N> } | { ok: false; error: string } {
  const resultado = ACCIONES[nombre].argumentos.safeParse(argumentos ?? {});
  if (resultado.success) return { ok: true, valor: resultado.data as ArgumentosAccion<N> };
  return { ok: false, error: resultado.error.issues.map((i) => `${i.path.join(".") || "argumentos"}: ${i.message}`).join("; ") };
}

/** Definiciones de herramientas (JSON Schema) para declarar en la sesión del modelo. */
export function definicionesParaModelo(ambito: AmbitoAsistente) {
  return accionesDelAmbito(ambito).map((nombre) => ({
    type: "function" as const,
    name: nombre,
    description: `${ACCIONES[nombre].descripcion} (Nivel ${ACCIONES[nombre].nivel}: ${NIVELES_AUTONOMIA[ACCIONES[nombre].nivel]})`,
    parameters: z.toJSONSchema(ACCIONES[nombre].argumentos),
  }));
}

/** Recibo que devuelve la interfaz tras ejecutar (o rechazar) una acción. */
export interface ReciboAccion {
  llamadaId: string;
  accion: NombreAccion;
  estado: "completada" | "preparada_para_confirmar" | "fallida";
  /** Mensaje legible para el modelo y para el historial de la interfaz. */
  mensaje: string;
  /** Datos compactos para el modelo (sin datos personales). */
  datos?: unknown;
}
