import { t } from "i18next";
import type { CampoEscenario, OpcionCampo } from "./datos-demo";
import { formatearFecha } from "@/design-system";

function etiquetaOpcion(opciones: readonly OpcionCampo[] | undefined, valor: string): string {
  return opciones?.find((opcion) => opcion.valor === valor)?.etiqueta ?? valor;
}

/**
 * Texto legible de un dato capturado en un formulario simulado (revisión antes de enviar y detalle
 * de la gestión): opciones con su etiqueta, fechas en español y casillas como «Sí»/«No».
 */
export function valorParaMostrar(campo: Pick<CampoEscenario, "tipo" | "opciones">, valor: unknown, opcionesExtra?: readonly OpcionCampo[]): string {
  if (valor === null || valor === undefined || valor === "") return t("Sin capturar");
  if (typeof valor === "boolean") return valor ? t("Sí") : t("No");
  const texto = String(valor);
  if (campo.tipo === "seleccion" || campo.tipo === "hora") return etiquetaOpcion(opcionesExtra ?? campo.opciones, texto);
  if (campo.tipo === "fecha") return formatearFecha(texto, "larga");
  return texto;
}
