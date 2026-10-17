import type { CanalEntrada, CategoriaReporte, EtapaBandeja, SectorId, TipoIncidencia, TipoOperativo } from "@/types";
import { CATEGORIAS_REPORTE, NOMBRE_CATEGORIA_REPORTE } from "../reportes";

/**
 * Vocabulario del Centro de operaciones (demostración). Datos puros: sin DOM, sin estilos.
 * Los colores e íconos de cada sector viven en la capa de presentación del módulo.
 */

export interface SectorOperacion {
  id: SectorId;
  /** Título largo (bandas del Laboratorio, Figma 32:162). */
  nombre: string;
  /** Rótulo corto para navegación y leyendas. */
  nombreCorto: string;
}

/** Orden fijo de presentación. Agrupación del prototipo, no una estructura orgánica oficial. */
export const SECTORES_OPERACION: readonly SectorOperacion[] = [
  { id: "seguridad", nombre: "Seguridad y Protección", nombreCorto: "Seguridad" },
  { id: "movilidad", nombre: "Movilidad y Tránsito", nombreCorto: "Movilidad" },
  { id: "medio_ambiente", nombre: "Medio ambiente", nombreCorto: "Medio ambiente" },
  { id: "tramites", nombre: "Trámites y Atención", nombreCorto: "Atención" },
  { id: "territorio", nombre: "Desarrollo Urbano", nombreCorto: "Desarrollo Urbano" },
] as const;

export const IDS_SECTOR: readonly SectorId[] = SECTORES_OPERACION.map((s) => s.id);

export const AVISO_AGRUPACION_SECTORES =
  "Agrupación por sectores del prototipo. No representa la estructura orgánica oficial del Ayuntamiento.";

export const TIPOS_OPERATIVOS: readonly TipoOperativo[] = [
  "semaforo",
  "obstruccion_banqueta",
  "arbol_riesgo",
  "ruido_vecinal",
  "orientacion",
  "riesgo_proteccion_civil",
  "vehiculo_abandonado",
] as const;

/** Nombres de los tipos operativos ficticios (se rotulan «Demostración» en la interfaz). */
export const NOMBRE_TIPO_OPERATIVO: Record<TipoOperativo, string> = {
  semaforo: "Semáforo fuera de servicio",
  obstruccion_banqueta: "Obstrucción de banqueta",
  arbol_riesgo: "Árbol con riesgo de caída",
  ruido_vecinal: "Ruido vecinal",
  orientacion: "Solicitud de orientación",
  riesgo_proteccion_civil: "Riesgo en vía pública (protección civil)",
  vehiculo_abandonado: "Vehículo abandonado en vía pública",
};

export const TIPOS_INCIDENCIA: readonly TipoIncidencia[] = [...CATEGORIAS_REPORTE, ...TIPOS_OPERATIVOS];

export function esCategoriaReporte(tipo: TipoIncidencia): tipo is CategoriaReporte {
  return (CATEGORIAS_REPORTE as readonly string[]).includes(tipo);
}

export function esTipoOperativo(tipo: TipoIncidencia): tipo is TipoOperativo {
  return !esCategoriaReporte(tipo);
}

export function nombreTipoIncidencia(tipo: TipoIncidencia): string {
  return esCategoriaReporte(tipo) ? NOMBRE_CATEGORIA_REPORTE[tipo] : NOMBRE_TIPO_OPERATIVO[tipo];
}

/** Sector de cada tipo (agrupación del prototipo). */
export const SECTOR_DE_TIPO: Record<TipoIncidencia, SectorId> = {
  bache: "movilidad",
  luminaria: "territorio",
  desazolve_rejilla: "territorio",
  basura_via_publica: "medio_ambiente",
  animal_muerto: "medio_ambiente",
  parques_jardines: "medio_ambiente",
  recoleccion_basura: "medio_ambiente",
  semaforo: "movilidad",
  obstruccion_banqueta: "movilidad",
  arbol_riesgo: "medio_ambiente",
  ruido_vecinal: "territorio",
  orientacion: "tramites",
  riesgo_proteccion_civil: "seguridad",
  vehiculo_abandonado: "seguridad",
};

export function sectorDeTipo(tipo: TipoIncidencia): SectorId {
  return SECTOR_DE_TIPO[tipo];
}

export function nombreSector(id: SectorId): string {
  return SECTORES_OPERACION.find((s) => s.id === id)?.nombre ?? id;
}

export const CANALES_ENTRADA: readonly CanalEntrada[] = ["whatsapp", "portal_ciudadano", "telefono", "app_ciudadana"] as const;

/** Canales simulados: ninguno está conectado a un sistema real (AGENTS §2.13). */
export const NOMBRE_CANAL: Record<CanalEntrada, string> = {
  whatsapp: "WhatsApp",
  portal_ciudadano: "Portal ciudadano",
  telefono: "Teléfono",
  app_ciudadana: "App ciudadana",
};

export const ETAPAS_BANDEJA: readonly EtapaBandeja[] = ["nueva", "por_asignar", "en_proceso", "solucionado", "cancelado"] as const;

/**
 * Etiquetas de etapa. «Nueva» y «Por asignar» son etapas internas de la bandeja; las demás usan
 * las etiquetas municipales de Mérida Móvil (AGENTS §2.7).
 */
export const ETIQUETA_ETAPA: Record<EtapaBandeja, string> = {
  nueva: "Nueva",
  por_asignar: "Por asignar",
  en_proceso: "En proceso de atención",
  solucionado: "Solucionado",
  cancelado: "Cancelado",
};

/** Etiqueta corta para pestañas. */
export const ETIQUETA_CORTA_ETAPA: Record<EtapaBandeja, string> = {
  nueva: "Nuevas",
  por_asignar: "Por asignar",
  en_proceso: "En proceso",
  solucionado: "Solucionadas",
  cancelado: "Canceladas",
};

export const ETAPAS_ABIERTAS: readonly EtapaBandeja[] = ["nueva", "por_asignar", "en_proceso"] as const;
