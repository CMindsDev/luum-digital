import type { CapaMapa, CapaMapaId, Rol } from "@/types";

/**
 * Capas del Visor Urbano del prototipo. Cada una declara su naturaleza (demostración, oficial o
 * ilustrativa) y quién la ve. Se rotulan siempre por separado en la leyenda (AGENTS.md §2.12).
 */

export const LEYENDA_DEMANDA_REPORTADA =
  "Demanda reportada (datos de demostración). La prioridad del servicio no se decide por popularidad.";

/** Respaldo si la fuente de datos no trae su propia leyenda. */
export const LEYENDA_BIENESTAR_RESPALDO = "Datos ficticios agregados; no provienen de conversaciones.";

const TODOS: Rol[] = ["ciudadania", "operador", "administracion"];

export const CAPAS_VISOR: readonly CapaMapa[] = [
  {
    id: "incidencias_puntos",
    nombre: "Incidencias de demostración",
    descripcion:
      "Reportes ficticios (baches, luminarias, basura y más) con su estado municipal. Los círculos con número agrupan incidencias cercanas: tócalos para acercar.",
    naturaleza: "demostracion",
    visiblePara: TODOS,
  },
  {
    id: "incidencias_calor",
    nombre: "Calor de demanda reportada",
    descripcion: "Dónde se concentran los reportes de demostración. Más intenso = más reportes cercanos.",
    naturaleza: "demostracion",
    visiblePara: TODOS,
  },
  {
    id: "incidencias_celdas",
    nombre: "Zonas con más reportes",
    descripcion: "Conteo de reportes por zona hexagonal (H3). Tamaño ciudad (resolución 8) o colonia (resolución 9).",
    naturaleza: "demostracion",
    visiblePara: TODOS,
  },
  {
    id: "servicios_verificados",
    nombre: "Ubicaciones de atención verificadas",
    descripcion:
      "Sedes municipales con dirección publicada en fuentes oficiales. Sólo se dibujan las que publican coordenadas; las demás aparecen en la lista.",
    naturaleza: "oficial",
    visiblePara: TODOS,
  },
  {
    id: "territorial_ilustrativa",
    nombre: "Información territorial oficial",
    descripcion:
      "Sin acceso autorizado a las capas del Visor Urbano ni del Geoportal de Mérida: no se muestran predios, límites ni claves catastrales, zonificación ni usos de suelo.",
    naturaleza: "ilustrativa",
    visiblePara: TODOS,
  },
  {
    id: "demanda_bienestar_agregada",
    nombre: "Demanda de bienestar agregada",
    descripcion: "Zonas grandes con un mínimo de registros, sólo para operación. Nunca muestra personas ni conversaciones.",
    naturaleza: "demostracion",
    visiblePara: ["operador", "administracion"],
  },
];

export function capaVisor(id: CapaMapaId): CapaMapa {
  const capa = CAPAS_VISOR.find((candidata) => candidata.id === id);
  if (!capa) throw new Error(`Capa desconocida: ${id}`);
  return capa;
}

export function puedeVerCapa(id: CapaMapaId, rol: Rol): boolean {
  return capaVisor(id).visiblePara.includes(rol);
}
