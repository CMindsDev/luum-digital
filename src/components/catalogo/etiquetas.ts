import {
  BadgeCheck,
  CalendarDays,
  ClipboardPen,
  CreditCard,
  FileSearch,
  Info,
  MapPinned,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import type { CanalAtencion, CategoriaId, CostoServicio, EstadoInformacion, TipoRecorrido } from "@/types";

/**
 * Etiquetas compartidas del Catálogo Municipal (fichas, recorridos y gestiones).
 * Los textos describen el recorrido INTERNO del prototipo: todo lo transaccional es simulado.
 */

export const ETIQUETA_TIPO_RECORRIDO: Record<TipoRecorrido, string> = {
  informativo: "Información y orientación",
  formulario: "Solicitud en línea (simulada)",
  cita: "Solicitud de cita (simulada)",
  pago: "Pago (simulado)",
  consulta_documental: "Consulta de documentos",
  consulta_territorial: "Consulta territorial",
  reporte: "Reporte en la vía pública",
  verificacion: "Verificación de visitas",
};

export const ICONO_TIPO_RECORRIDO: Record<TipoRecorrido, LucideIcon> = {
  informativo: Info,
  formulario: ClipboardPen,
  cita: CalendarDays,
  pago: CreditCard,
  consulta_documental: FileSearch,
  consulta_territorial: MapPinned,
  reporte: Megaphone,
  verificacion: BadgeCheck,
};

/** Texto del botón que abre el recorrido desde la ficha. */
export const ACCION_TIPO_RECORRIDO: Record<TipoRecorrido, string> = {
  informativo: "Ver cómo hacerlo",
  formulario: "Iniciar solicitud simulada",
  cita: "Solicitar cita simulada",
  pago: "Hacer pago simulado",
  consulta_documental: "Consultar documentos",
  consulta_territorial: "Consultar en el Visor Urbano",
  reporte: "Hacer un reporte",
  verificacion: "Verificar una visita",
};

/** Qué pasa al abrir el recorrido (se muestra junto al botón de la ficha). */
export const DESCRIPCION_TIPO_RECORRIDO: Record<TipoRecorrido, string> = {
  informativo: "Te mostramos requisitos, pasos y canales para preparar tu gestión. No se envía nada.",
  formulario: "Llenas un formulario de ejemplo y obtienes un folio DEMO-G sin validez oficial.",
  cita: "Eliges sede y horario de ejemplo. Es una solicitud simulada: no reserva ningún lugar.",
  pago: "Recorrido de pago simulado: no se cobra nada y no pide datos de tarjetas reales.",
  consulta_documental: "Buscas regulaciones y documentos relacionados en el catálogo, con su fuente.",
  consulta_territorial: "Abres el Visor Urbano del prototipo. No incluye capas catastrales oficiales.",
  reporte: "Abres el formulario de reportes del prototipo para obtener un folio DEMO-R.",
  verificacion: "Consultas credenciales de ejemplo y cómo verificar a una persona real en el canal oficial.",
};

export const TIPOS_RECORRIDO = Object.keys(ETIQUETA_TIPO_RECORRIDO) as TipoRecorrido[];

export const ETIQUETA_FILTRO_INFORMACION: Record<EstadoInformacion, string> = {
  verificada: "Verificada",
  pendiente: "Pendiente de verificar",
  demostracion: "Demostración",
};

export const ESTADOS_INFORMACION = Object.keys(ETIQUETA_FILTRO_INFORMACION) as EstadoInformacion[];

/** Ids de categoría válidos (para leer filtros de la URL sin confiar en el texto). */
const CATEGORIAS_VALIDAS: Record<CategoriaId, true> = {
  reportes: true,
  pagos: true,
  negocios: true,
  empleo: true,
  territorio: true,
  atencion_ciudadana: true,
  regulaciones: true,
  visitas_domiciliarias: true,
  bienestar: true,
  educacion: true,
  cultura: true,
  deporte: true,
  medio_ambiente: true,
  seguridad: true,
  turismo: true,
};

export function esCategoriaId(valor: string | null | undefined): valor is CategoriaId {
  return typeof valor === "string" && Object.hasOwn(CATEGORIAS_VALIDAS, valor);
}

export function esTipoRecorrido(valor: string | null | undefined): valor is TipoRecorrido {
  return typeof valor === "string" && Object.hasOwn(ETIQUETA_TIPO_RECORRIDO, valor);
}

export function esEstadoInformacion(valor: string | null | undefined): valor is EstadoInformacion {
  return typeof valor === "string" && Object.hasOwn(ETIQUETA_FILTRO_INFORMACION, valor);
}

export const ETIQUETA_TIPO_CANAL: Record<CanalAtencion["tipo"], string> = {
  telefono: "Teléfono",
  presencial: "Presencial",
  en_linea: "En línea",
  correo: "Correo electrónico",
  app: "App",
};

/**
 * Texto del costo tal como lo publica la fuente. Nunca inventa montos: si la fuente no lo indica
 * o no se contrastó, devuelve null (la interfaz lo muestra como «Pendiente de verificar»).
 */
export function textoCosto(costo: CostoServicio | undefined): string | null {
  if (!costo || costo.tipo === "pendiente") return null;
  if (costo.texto?.trim()) return costo.texto.trim();
  if (costo.tipo === "gratuito") return "Gratuito (según la fuente)";
  if (costo.tipo === "variable") return "Variable (según la fuente)";
  return null;
}

/** Ruta interna del recorrido simulado de un servicio. */
export function rutaRecorrido(servicioId: string): string {
  return `/servicios/${encodeURIComponent(servicioId)}/iniciar`;
}

export function rutaFicha(servicioId: string): string {
  return `/servicios/${encodeURIComponent(servicioId)}`;
}
