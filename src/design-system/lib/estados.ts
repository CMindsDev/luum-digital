import {
  BadgeCheck,
  CircleCheck,
  CircleDashed,
  CircleHelp,
  CircleX,
  Clock,
  FlaskConical,
  Hourglass,
  Inbox,
  Minus,
  PlugZap,
  ScanSearch,
  ShieldCheck,
  TriangleAlert,
  Unplug,
  type LucideIcon,
} from "lucide-react";
import { msg } from "@/i18n";
import type {
  EstadoInformacion,
  EstadoIntegracion,
  EstadoMunicipal,
  EstadoVerificacionCiudadana,
  MotivoCancelacion,
} from "@/types";

/**
 * Etiquetas e íconos de los estados del prototipo. Los estados se comunican siempre con
 * ícono + texto; el color es un refuerzo.
 */

/** Etiquetas de estado municipal para una insignia (Mérida Móvil, «Mis reportes»). */
export const ETIQUETA_ESTADO_MUNICIPAL: Record<EstadoMunicipal, string> = {
  registrado: msg("Registrado"),
  en_proceso: msg("En proceso de atención"),
  solucionado: msg("Solucionado"),
  cancelado: msg("Cancelado"),
};

/** Etiquetas literales de la lista de estatus de «Mis reportes» de Mérida Móvil (para filtros). */
export const ETIQUETA_FILTRO_ESTADO_MUNICIPAL: Record<EstadoMunicipal, string> = {
  registrado: msg("Registrado"),
  en_proceso: msg("En proceso de atención"),
  solucionado: msg("Solucionado"),
  cancelado: msg("Motivo de cancelación"),
};

export const ICONO_ESTADO_MUNICIPAL: Record<EstadoMunicipal, LucideIcon> = {
  registrado: Inbox,
  en_proceso: Clock,
  solucionado: CircleCheck,
  cancelado: CircleX,
};

export const ETIQUETA_MOTIVO_CANCELACION: Record<MotivoCancelacion, string> = {
  duplicado: msg("Duplicado"),
  no_procede: msg("No procede"),
  fuera_de_competencia: msg("Fuera de competencia municipal"),
  informacion_insuficiente: msg("Información insuficiente"),
};

/** Verificación ciudadana: independiente del estado municipal (un voto nunca cierra un reporte). */
export const ETIQUETA_VERIFICACION: Record<EstadoVerificacionCiudadana, string> = {
  no_aplica: msg("Sin atención que verificar"),
  pendiente: msg("Verificación pendiente"),
  coincide: msg("Coincide"),
  discrepancia: msg("Discrepancia"),
  no_concluyente: msg("No concluyente"),
};

export const ICONO_VERIFICACION: Record<EstadoVerificacionCiudadana, LucideIcon> = {
  no_aplica: Minus,
  pendiente: ScanSearch,
  coincide: BadgeCheck,
  discrepancia: TriangleAlert,
  no_concluyente: CircleHelp,
};

export const ETIQUETA_INFORMACION: Record<EstadoInformacion, string> = {
  verificada: msg("Verificada"),
  pendiente: msg("Pendiente de verificar"),
  demostracion: msg("Demostración"),
};

export const DESCRIPCION_INFORMACION: Record<EstadoInformacion, string> = {
  verificada: msg("Consultada en una fuente oficial, con enlace y fecha de consulta."),
  pendiente: msg("Existe en una fuente oficial, pero faltan datos o no se pudieron contrastar."),
  demostracion: msg("Contenido ficticio creado para esta demostración."),
};

export const ICONO_INFORMACION: Record<EstadoInformacion, LucideIcon> = {
  verificada: ShieldCheck,
  pendiente: Hourglass,
  demostracion: FlaskConical,
};

export const ETIQUETA_INTEGRACION: Record<EstadoIntegracion, string> = {
  simulada: msg("Simulada localmente"),
  conectada: msg("Conectada y comprobada"),
};

export const DESCRIPCION_INTEGRACION: Record<EstadoIntegracion, string> = {
  simulada: msg("Formularios, folios y estados se simulan en este navegador. No llega a ningún sistema municipal."),
  conectada: msg("Conectada a un sistema real y comprobada."),
};

export const ICONO_INTEGRACION: Record<EstadoIntegracion, LucideIcon> = {
  simulada: Unplug,
  conectada: PlugZap,
};

/** Ícono neutro para estados sin dato. */
export const ICONO_SIN_DATO: LucideIcon = CircleDashed;
