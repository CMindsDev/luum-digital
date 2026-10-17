import type { Coordenadas, Reporte } from "@/types";

/** Inclusión por ray casting, incluyendo puntos sobre los bordes. Coordenadas WGS84. */
export function dentroDeArea(punto: Coordenadas, vertices: readonly Coordenadas[]): boolean {
  if (vertices.length < 3) return false;
  let dentro = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const a = vertices[i]!; const b = vertices[j]!;
    const cruz = (punto.lng - a.lng) * (b.lat - a.lat) - (punto.lat - a.lat) * (b.lng - a.lng);
    if (Math.abs(cruz) < 1e-10 && punto.lng >= Math.min(a.lng, b.lng) && punto.lng <= Math.max(a.lng, b.lng) && punto.lat >= Math.min(a.lat, b.lat) && punto.lat <= Math.max(a.lat, b.lat)) return true;
    if ((a.lat > punto.lat) !== (b.lat > punto.lat) && punto.lng < (b.lng - a.lng) * (punto.lat - a.lat) / (b.lat - a.lat) + a.lng) dentro = !dentro;
  }
  return dentro;
}

/** Área aproximada en km², proyección local equirectangular; no es medición catastral. */
export function superficieArea(vertices: readonly Coordenadas[]): number {
  if (vertices.length < 3) return 0;
  const lat = vertices.reduce((s, p) => s + p.lat, 0) / vertices.length;
  const factor = Math.cos(lat * Math.PI / 180);
  const origen = vertices[0]!;
  return Math.abs(vertices.reduce((s, a, i) => {
    const b = vertices[(i + 1) % vertices.length]!;
    return s + ((a.lng - origen.lng) * (b.lat - origen.lat) - (b.lng - origen.lng) * (a.lat - origen.lat));
  }, 0)) * 111.195 ** 2 * factor / 2;
}

const EPSILON = 1e-12;
function orientacion(a: Coordenadas, b: Coordenadas, c: Coordenadas): number {
  return (b.lng - a.lng) * (c.lat - a.lat) - (b.lat - a.lat) * (c.lng - a.lng);
}
function sobreSegmento(p: Coordenadas, a: Coordenadas, b: Coordenadas): boolean {
  return Math.abs(orientacion(a, b, p)) <= EPSILON && p.lng >= Math.min(a.lng, b.lng) - EPSILON && p.lng <= Math.max(a.lng, b.lng) + EPSILON && p.lat >= Math.min(a.lat, b.lat) - EPSILON && p.lat <= Math.max(a.lat, b.lat) + EPSILON;
}
function seCruzan(a: Coordenadas, b: Coordenadas, c: Coordenadas, d: Coordenadas): boolean {
  const abC = orientacion(a, b, c), abD = orientacion(a, b, d);
  const cdA = orientacion(c, d, a), cdB = orientacion(c, d, b);
  return ((abC > EPSILON && abD < -EPSILON || abC < -EPSILON && abD > EPSILON) &&
    (cdA > EPSILON && cdB < -EPSILON || cdA < -EPSILON && cdB > EPSILON)) ||
    sobreSegmento(c, a, b) || sobreSegmento(d, a, b) || sobreSegmento(a, c, d) || sobreSegmento(b, c, d);
}

/** Diagnóstico compartido por el dibujo, la edición y la entrada manual. */
export function diagnosticoArea(vertices: readonly Coordenadas[]): string | null {
  if (vertices.length < 3) return "Agrega al menos 3 puntos para delimitar el área.";
  if (vertices.some(p => !Number.isFinite(p.lat) || !Number.isFinite(p.lng) || Math.abs(p.lat) > 90 || Math.abs(p.lng) > 180)) return "Revisa las coordenadas de los puntos.";
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      if (Math.hypot(vertices[i]!.lat - vertices[j]!.lat, vertices[i]!.lng - vertices[j]!.lng) < 0.000005) return "Hay puntos repetidos o demasiado juntos. Arrástralos o elimina uno.";
    }
  }
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 2; j < vertices.length; j++) {
      if (i === 0 && j === vertices.length - 1) continue;
      if (seCruzan(vertices[i]!, vertices[(i + 1) % vertices.length]!, vertices[j]!, vertices[(j + 1) % vertices.length]!)) return "Dos bordes se cruzan. Arrastra un punto o deshaz el último.";
    }
    // Impide que dos bordes adyacentes retrocedan sobre el mismo tramo.
    const a = vertices[i]!, b = vertices[(i + 1) % vertices.length]!, c = vertices[(i + 2) % vertices.length]!;
    if (Math.abs(orientacion(a, b, c)) <= EPSILON && ((a.lng - b.lng) * (c.lng - b.lng) + (a.lat - b.lat) * (c.lat - b.lat)) > 0) return "Hay bordes superpuestos. Mueve o elimina el punto intermedio.";
  }
  if (superficieArea(vertices) < 0.000001) return "El área es demasiado pequeña o sus puntos están alineados.";
  return null;
}

export function areaValida(vertices: readonly Coordenadas[]): boolean {
  return diagnosticoArea(vertices) === null;
}

/** Evita que un doble toque añada el mismo vértice dos veces. */
export function agregarPuntoArea(vertices: readonly Coordenadas[], punto: Coordenadas): Coordenadas[] {
  if (vertices.some(v => Math.hypot(v.lat - punto.lat, v.lng - punto.lng) < 0.000005)) return [...vertices];
  return [...vertices, punto];
}

export function resumenOperativo(reportes: readonly Reporte[]) {
  return {
    total: reportes.length,
    pendientes: reportes.filter(r => r.estadoMunicipal === "registrado").length,
    enProceso: reportes.filter(r => r.estadoMunicipal === "en_proceso").length,
    cancelados: reportes.filter(r => r.estadoMunicipal === "cancelado").length,
    solucionados: reportes.filter(r => r.estadoMunicipal === "solucionado").length,
    riesgos: reportes.filter(r => r.riesgoDeclarado && (r.estadoMunicipal === "registrado" || r.estadoMunicipal === "en_proceso")).length,
    sinAsignar: reportes.filter(r => !r.equipoAsignado && (r.estadoMunicipal === "registrado" || r.estadoMunicipal === "en_proceso")).length,
  };
}
