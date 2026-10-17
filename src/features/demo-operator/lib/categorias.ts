import { msg } from "@/i18n";
import type { CategoriaId, CategoriaReporte, Servicio } from "@/types";

/** Accesos del inventario Trámites.md; colores e íconos entregados por el equipo. */
export const TEMAS_OPERACION = [
  { id: "reportes", nombre: msg("Reportes y baches"), icono: "reportes-y-baches", tono: "ambar", categoria: "reportes" },
  { id: "violencia", nombre: msg("Atención a mujeres"), icono: "atencion-ciudadana", tono: "magenta", categoria: "bienestar" },
  { id: "salud", nombre: msg("Salud y cuidados"), icono: "salud-y-cuidados", tono: "azul", categoria: "bienestar" },
  { id: "apoyos", nombre: msg("Apoyos sociales"), icono: "apoyos-sociales", tono: "magenta", categoria: "bienestar" },
  { id: "pagos", nombre: msg("Predial y pagos"), icono: "predial-y-pagos", tono: "crema", categoria: "pagos" },
  { id: "agua", nombre: msg("Agua en comisarías"), icono: "aguas", tono: "azul", categoria: "reportes" },
  { id: "empleo", nombre: msg("Empleo"), icono: "empleo", tono: "ambar", categoria: "empleo" },
  { id: "educacion", nombre: msg("Educación y becas"), icono: "educacion", tono: "cafe", categoria: "educacion" },
  { id: "vivienda", nombre: msg("Vivienda y obras"), icono: "vivienda-y-obras", tono: "ambar", categoria: "territorio" },
  { id: "negocios", nombre: msg("Negocios"), icono: "negocios", tono: "lima", categoria: "negocios" },
  { id: "documentos", nombre: msg("Documentos"), icono: "documentos", tono: "azul", categoria: "atencion_ciudadana" },
  { id: "animales", nombre: msg("Bienestar animal"), icono: "bienestar-animal", tono: "lima", categoria: "medio_ambiente" },
  { id: "funerarios", nombre: msg("Servicios funerarios"), icono: "servicios-funerales", tono: "cafe", categoria: "reportes" },
] as const satisfies readonly { id: string; nombre: string; icono: string; tono: string; categoria: CategoriaId }[];

export const ETIQUETA_CATEGORIA_REPORTE: Record<CategoriaReporte, string> = {
  bache: msg("Bache"),
  luminaria: msg("Luminaria"),
  desazolve_rejilla: msg("Desazolve de rejilla"),
  basura_via_publica: msg("Basura en vía pública"),
  animal_muerto: msg("Animal muerto"),
  parques_jardines: msg("Limpieza de parques y jardines"),
  recoleccion_basura: msg("Queja por falta de recolección de basura"),
};

export const COLORES_TEMA: Record<string, string> = {
  ambar: "bg-ambar text-cafe",
  magenta: "bg-magenta text-cafe",
  azul: "bg-azul text-white",
  lima: "bg-lima text-cafe",
  crema: "bg-crema text-tinta",
  cafe: "bg-cafe text-crema",
};

export const TONO_REPORTE: Record<CategoriaReporte, "ambar" | "azul" | "lima" | "magenta"> = {
  bache: "ambar",
  luminaria: "magenta",
  desazolve_rejilla: "azul",
  basura_via_publica: "lima",
  animal_muerto: "lima",
  parques_jardines: "lima",
  recoleccion_basura: "lima",
};

export const ICONO_REPORTE: Record<CategoriaReporte, string> = {
  bache: "reportes-y-baches",
  luminaria: "vivienda-y-obras",
  desazolve_rejilla: "aguas",
  basura_via_publica: "reportes-y-baches",
  animal_muerto: "bienestar-animal",
  parques_jardines: "bienestar-animal",
  recoleccion_basura: "reportes-y-baches",
};

/** Los accesos principales separan necesidades que el catálogo agrupa bajo una misma categoría. */
export function serviciosDelTema(servicios: readonly Servicio[], id: string): Servicio[] {
  const patrones: Record<string, RegExp> = {
    violencia: /violencia|refugio|atenci[oó]n.*mujer/i,
    salud: /salud|m[eé]dic|dental|nutrici|rehabilitaci|autismo|psicol[oó]g/i,
    apoyos: /despensa|aliment|discapacidad|infancia|apoyo|casa segura/i,
    agua: /agua potable|fuga|toma.*agua/i,
    funerarios: /funera|pante[oó]n|b[oó]veda/i,
    documentos: /constancia|certificad|c[eé]dula|cartilla|identidad|vecindad/i,
  };
  const tema = TEMAS_OPERACION.find((t) => t.id === id);
  return servicios.filter((s) => (patrones[id] ? patrones[id]!.test(s.nombre) : s.categoria === tema?.categoria));
}
