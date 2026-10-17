import type { Reporte } from "@/types";
export function normalizarConsulta(s: string): string { return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }

/** Consultas explícitas contra datos de la demo; nunca interpreta una pregunta como una mutación. */
export function consultarIncidencias(reportes: readonly Reporte[], pregunta: string): Reporte[] {
  const q = normalizarConsulta(pregunta);
  const colonias = [...new Set(reportes.map(r => r.ubicacion.colonia).filter((c): c is string => Boolean(c)))];
  const colonia = colonias.find(c => q.includes(normalizarConsulta(c)));
  const folio = q.match(/demo-r-\d+/)?.[0];
  return reportes.filter(r => {
    if (colonia && r.ubicacion.colonia !== colonia) return false;
    if (folio && normalizarConsulta(r.folio) !== folio) return false;
    if (/bache/.test(q) && r.categoria !== "bache") return false;
    if (/luminaria|alumbrado/.test(q) && r.categoria !== "luminaria") return false;
    if (/rejilla|desazolve/.test(q) && r.categoria !== "desazolve_rejilla") return false;
    if (/parque|jardin/.test(q) && r.categoria !== "parques_jardines") return false;
    if (/basura|residuo/.test(q) && !["basura_via_publica", "recoleccion_basura"].includes(r.categoria)) return false;
    if (/riesgo|urgente|prioridad/.test(q) && !(r.riesgoDeclarado && ["registrado", "en_proceso"].includes(r.estadoMunicipal))) return false;
    if (/sin asignar|sin equipo/.test(q) && (r.equipoAsignado || !["registrado", "en_proceso"].includes(r.estadoMunicipal))) return false;
    if (/pendiente|registrado/.test(q) && r.estadoMunicipal !== "registrado") return false;
    if (/solucionad|resuelt/.test(q) && r.estadoMunicipal !== "solucionado") return false;
    if (/en proceso/.test(q) && r.estadoMunicipal !== "en_proceso") return false;
    if (/cancelad/.test(q) && r.estadoMunicipal !== "cancelado") return false;
    return true;
  });
}
