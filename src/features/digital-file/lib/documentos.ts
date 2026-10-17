import { House, IdCard, ReceiptText, ScrollText, type LucideIcon } from "lucide-react";
import type { TonoMosaico } from "@/design-system";
import { msg } from "@/i18n";
import type { DocumentoDemo, TipoDocumentoDemo } from "@/types";

/** Marca visible en toda vista previa: los documentos del expediente de la demo son ficticios. */
export const MARCA_DOCUMENTO_EJEMPLO = msg("DOCUMENTO DE EJEMPLO");

/** Presentación por tipo de documento ficticio (ícono + texto; el color sólo refuerza). */
export const TIPO_DOCUMENTO: Record<TipoDocumentoDemo, { etiqueta: string; icono: LucideIcon; tono: TonoMosaico }> = {
  identificacion_ejemplo: { etiqueta: msg("Identificación de ejemplo"), icono: IdCard, tono: "azul" },
  comprobante_domicilio_ejemplo: { etiqueta: msg("Comprobante de domicilio de ejemplo"), icono: House, tono: "lima" },
  constancia_ejemplo: { etiqueta: msg("Constancia de ejemplo"), icono: ScrollText, tono: "ambar" },
  recibo_simulado: { etiqueta: msg("Recibo simulado (sin validez fiscal)"), icono: ReceiptText, tono: "cafe" },
};

export function rutaDocumento(id: string): string {
  return `/expediente/documentos/${encodeURIComponent(id)}`;
}

/**
 * Líneas de la vista previa sin la marca: la marca se dibuja siempre aparte, aunque el dato no la
 * traiga, para que ningún documento del expediente parezca real.
 */
export function lineasVistaPrevia(documento: Pick<DocumentoDemo, "vistaPrevia">): string[] {
  return documento.vistaPrevia.map((linea) => linea.trim()).filter((linea) => linea !== "" && linea.toUpperCase() !== MARCA_DOCUMENTO_EJEMPLO);
}

/** Documentos ligados a una gestión (ids en `gestionesRelacionadas`). */
export function documentosDeGestion(documentos: readonly DocumentoDemo[], gestionId: string): DocumentoDemo[] {
  return documentos.filter((documento) => documento.gestionesRelacionadas.includes(gestionId));
}
