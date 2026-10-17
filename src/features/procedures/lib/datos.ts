import { t } from "i18next";
import { msg } from "@/i18n";
import type { EscenarioDemo } from "@/components/catalogo/datos-demo";
import type { Gestion } from "@/types";

const ETIQUETAS_CONOCIDAS: Record<string, string> = {
  nombreCompleto: msg("Nombre completo"),
  correo: msg("Correo electrónico"),
  telefono: msg("Teléfono"),
  motivo: msg("¿Qué necesitas?"),
  nombreNegocio: msg("Nombre del negocio"),
  giro: msg("Giro"),
  calle: msg("Calle"),
  numero: msg("Número"),
  colonia: msg("Colonia"),
  codigoPostal: msg("Código postal"),
  superficie: msg("Superficie aproximada (m²)"),
  tipoDemanda: msg("Tipo de demanda"),
  tramite: msg("Trámite o servicio"),
  hechos: msg("¿Qué pasó?"),
  sede: msg("Sede"),
  fecha: msg("Fecha"),
  hora: msg("Horario de ejemplo"),
  metodo: msg("Método de pago simulado"),
  referenciaPredio: msg("Referencia del predio (ejemplo)"),
  entiendoSimulacion: msg("Entiendo que es una simulación"),
  referenciaCita: msg("Referencia de la solicitud de cita"),
  conceptoPago: msg("Concepto del pago simulado"),
  montoDemo: msg("Monto ficticio"),
};

export const CLAVES_SECCION_PROPIA = new Set(["referenciaCita", "conceptoPago", "montoDemo"]);

function humanizar(clave: string): string {
  const texto = clave.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function etiquetaDato(clave: string, escenario?: EscenarioDemo | null): string {
  const literal = escenario?.campos.find((campo) => campo.nombre === clave)?.etiqueta ?? ETIQUETAS_CONOCIDAS[clave] ?? humanizar(clave);
  return t(literal);
}

export function referenciaPago(gestion: Pick<Gestion, "historial">): { referencia: string; aprobado: boolean } | null {
  for (let i = gestion.historial.length - 1; i >= 0; i -= 1) {
    const descripcion = gestion.historial[i]?.descripcion ?? "";
    const coincidencia = /DEMO-P-\d{7}/.exec(descripcion);
    if (coincidencia) return { referencia: coincidencia[0], aprobado: /aprobado/i.test(descripcion) };
  }
  return null;
}

export function textoDato(valor: Gestion["datos"][string]): string {
  if (valor === null || valor === "") return t("Sin capturar");
  if (typeof valor === "boolean") return valor ? t("Sí") : t("No");
  return String(valor);
}
