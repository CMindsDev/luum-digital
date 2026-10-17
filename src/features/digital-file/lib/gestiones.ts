import { t } from "i18next";
import { CircleAlert, CircleCheck, CircleX, Clock, PencilLine, Send, type LucideIcon } from "lucide-react";
import type { TonoInsignia } from "@/design-system";
import { msg } from "@/i18n";
import type { CampoReutilizable, DocumentoDemo, EstadoGestion, Gestion } from "@/types";
import { documentosDeGestion } from "./documentos";

/** Estado de una gestión simulada con ícono + texto (nunca sólo color). */
export const ESTADO_GESTION: Record<EstadoGestion, { etiqueta: string; icono: LucideIcon; tono: TonoInsignia }> = {
  borrador: { etiqueta: msg("Borrador"), icono: PencilLine, tono: "neutro" },
  enviada: { etiqueta: msg("Enviada (simulada)"), icono: Send, tono: "azul" },
  en_revision: { etiqueta: msg("En revisión"), icono: Clock, tono: "info" },
  requiere_informacion: { etiqueta: msg("Requiere información"), icono: CircleAlert, tono: "aviso" },
  resuelta: { etiqueta: msg("Resuelta"), icono: CircleCheck, tono: "exito" },
  cancelada: { etiqueta: msg("Cancelada"), icono: CircleX, tono: "peligro" },
};

/** Etiquetas de los datos del expediente que pueden reutilizarse. */
export const ETIQUETA_CAMPO_EXPEDIENTE: Record<CampoReutilizable["campo"], string> = {
  nombreCompleto: msg("Nombre completo"),
  correo: msg("Correo electrónico"),
  telefono: msg("Teléfono"),
  calle: msg("Calle"),
  numero: msg("Número"),
  colonia: msg("Colonia"),
  codigoPostal: msg("Código postal"),
};

function esCampoExpediente(nombre: string): nombre is CampoReutilizable["campo"] {
  return Object.hasOwn(ETIQUETA_CAMPO_EXPEDIENTE, nombre);
}

/** Etiqueta legible de un campo reutilizado (los formularios usan los mismos nombres que el expediente). */
export function etiquetaCampo(nombre: string): string {
  if (esCampoExpediente(nombre)) return ETIQUETA_CAMPO_EXPEDIENTE[nombre];
  const separado = nombre.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").trim().toLowerCase();
  return separado.charAt(0).toUpperCase() + separado.slice(1);
}

function valorLegible(valor: Gestion["datos"][string] | undefined): string | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === "boolean") return valor ? t("Sí") : t("No");
  const texto = String(valor).trim();
  return texto === "" ? null : texto;
}

export interface DatoReutilizado {
  nombre: string;
  etiqueta: string;
  /** Valor guardado en la gestión (puede no estar si el borrador quedó incompleto). */
  valor: string | null;
}

export interface GestionRelacionada {
  gestion: Gestion;
  reutilizados: DatoReutilizado[];
  documentos: DocumentoDemo[];
}

/**
 * Gestiones relacionadas con el expediente: usaron datos del expediente (con confirmación) o
 * tienen documentos de ejemplo ligados. Las más recientes primero.
 */
export function gestionesRelacionadas(
  gestiones: readonly Gestion[],
  documentos: readonly DocumentoDemo[],
  maximo = 5,
): GestionRelacionada[] {
  return gestiones
    .map((gestion) => ({
      gestion,
      reutilizados: gestion.camposReutilizados.map((nombre) => ({
        nombre,
        etiqueta: etiquetaCampo(nombre),
        valor: valorLegible(gestion.datos[nombre]),
      })),
      documentos: documentosDeGestion(documentos, gestion.id),
    }))
    .filter((relacion) => relacion.reutilizados.length > 0 || relacion.documentos.length > 0)
    .sort((a, b) => b.gestion.actualizadaEn.localeCompare(a.gestion.actualizadaEn))
    .slice(0, maximo);
}

export function rutaGestion(id: string): string {
  return `/gestiones/${encodeURIComponent(id)}`;
}
