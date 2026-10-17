import type { EscenarioDemo } from "@/components/catalogo/datos-demo";
import type { Gestion } from "@/types";

/**
 * Presentación de `Gestion.datos` en el detalle. Las etiquetas salen del escenario del servicio
 * cuando existe; si no (gestiones semilla o servicios sin formulario), de este diccionario.
 */
const ETIQUETAS_CONOCIDAS: Record<string, string> = {
  nombreCompleto: "Nombre completo",
  correo: "Correo electrónico",
  telefono: "Teléfono",
  motivo: "¿Qué necesitas?",
  nombreNegocio: "Nombre del negocio",
  giro: "Giro",
  calle: "Calle",
  numero: "Número",
  colonia: "Colonia",
  codigoPostal: "Código postal",
  superficie: "Superficie aproximada (m²)",
  tipoDemanda: "Tipo de demanda",
  tramite: "Trámite o servicio",
  hechos: "¿Qué pasó?",
  sede: "Sede",
  fecha: "Fecha",
  hora: "Horario de ejemplo",
  metodo: "Método de pago simulado",
  referenciaPredio: "Referencia del predio (ejemplo)",
  entiendoSimulacion: "Entiendo que es una simulación",
  referenciaCita: "Referencia de la solicitud de cita",
  conceptoPago: "Concepto del pago simulado",
  montoDemo: "Monto ficticio",
};

/** Datos de pago y cita que se muestran en sus propias secciones, no en «Datos capturados». */
export const CLAVES_SECCION_PROPIA = new Set(["referenciaCita", "conceptoPago", "montoDemo"]);

function humanizar(clave: string): string {
  const texto = clave.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function etiquetaDato(clave: string, escenario?: EscenarioDemo | null): string {
  return escenario?.campos.find((campo) => campo.nombre === clave)?.etiqueta ?? ETIQUETAS_CONOCIDAS[clave] ?? humanizar(clave);
}

/** Referencia DEMO-P del pago simulado registrada en el historial (la más reciente). */
export function referenciaPago(gestion: Pick<Gestion, "historial">): { referencia: string; aprobado: boolean } | null {
  for (let i = gestion.historial.length - 1; i >= 0; i -= 1) {
    const descripcion = gestion.historial[i]?.descripcion ?? "";
    const coincidencia = /DEMO-P-\d{7}/.exec(descripcion);
    if (coincidencia) return { referencia: coincidencia[0], aprobado: /aprobado/i.test(descripcion) };
  }
  return null;
}

export function textoDato(valor: Gestion["datos"][string]): string {
  if (valor === null || valor === "") return "Sin capturar";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  return String(valor);
}
