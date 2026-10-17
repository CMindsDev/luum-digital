import type { CategoriaReporte, Coordenadas, PosibleDuplicado, Reporte, Ubicacion } from "@/types";
import { NOMBRE_CATEGORIA_REPORTE, estaAbierto } from "./reportes";

/**
 * Detección de posibles duplicados (como «Solicitud existente» de Reporta en línea).
 *
 * Un reporte existente es posible duplicado si:
 * - es del mismo tipo,
 * - sigue abierto (registrado o en proceso de atención),
 * - se creó dentro de la ventana (45 días por defecto), y
 * - está a 60 m o menos, o comparte colonia y calle principal normalizadas.
 */

export const RADIO_DUPLICADO_METROS = 60;
export const VENTANA_DUPLICADO_DIAS = 45;

const RADIO_TIERRA_METROS = 6_371_008.8;

export function distanciaMetros(a: Coordenadas, b: Coordenadas): number {
  const rad = (grados: number) => (grados * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_METROS * Math.asin(Math.min(1, Math.sqrt(h)));
}

function sinAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** "Col. Centro" -> "centro"; "Fracc. Pensiones" -> "pensiones". */
export function normalizarColonia(colonia: string | undefined): string {
  if (!colonia) return "";
  return sinAcentos(colonia)
    .toLowerCase()
    .replace(/\b(col|colonia|fracc|fraccionamiento|comisaria|barrio)\b\.?/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calle principal normalizada a partir de la referencia («Calle 60 x 59 y 61» -> "calle 60").
 * Se toma lo que hay antes de los cruzamientos (x, por, entre, esquina).
 */
export function normalizarCalle(referencia: string | undefined): string {
  if (!referencia) return "";
  const base = sinAcentos(referencia).toLowerCase().replace(/[#.,;:]/g, " ");
  const principal = base.split(/\s(?:x|por|entre|esq|esquina|cruzamiento|cruz|y)\s/)[0] ?? base;
  return principal
    .replace(/\b(c|cll|cal)\b/g, "calle")
    .replace(/\bav\b|\bavda\b/g, "avenida")
    .replace(/\bno\b|\bnum\b|\bnumero\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function diasEntre(desde: string, hasta: Date): number {
  return (hasta.getTime() - new Date(desde).getTime()) / 86_400_000;
}

function describirAntiguedad(dias: number): string {
  const enteros = Math.max(0, Math.floor(dias));
  if (enteros === 0) return "hoy";
  if (enteros === 1) return "hace 1 día";
  return `hace ${enteros} días`;
}

export function buscarPosiblesDuplicados(
  input: { categoria: CategoriaReporte; ubicacion: Pick<Ubicacion, "lat" | "lng" | "referencia" | "colonia"> },
  reportes: readonly Reporte[],
  ahora: Date,
  opciones: { radioMetros?: number; ventanaDias?: number } = {},
): PosibleDuplicado[] {
  const radio = opciones.radioMetros ?? RADIO_DUPLICADO_METROS;
  const ventana = opciones.ventanaDias ?? VENTANA_DUPLICADO_DIAS;
  const coloniaBuscada = normalizarColonia(input.ubicacion.colonia);
  const calleBuscada = normalizarCalle(input.ubicacion.referencia);

  const resultado: PosibleDuplicado[] = [];
  for (const reporte of reportes) {
    if (reporte.categoria !== input.categoria || !estaAbierto(reporte)) continue;
    const dias = diasEntre(reporte.creadoEn, ahora);
    if (dias > ventana || dias < -1) continue;
    const distancia = distanciaMetros(input.ubicacion, reporte.ubicacion);
    const mismaCalle =
      coloniaBuscada !== "" &&
      calleBuscada !== "" &&
      normalizarColonia(reporte.ubicacion.colonia) === coloniaBuscada &&
      normalizarCalle(reporte.ubicacion.referencia) === calleBuscada;
    if (distancia > radio && !mismaCalle) continue;
    const tipo = NOMBRE_CATEGORIA_REPORTE[reporte.categoria];
    const cuando = describirAntiguedad(dias);
    const motivo =
      distancia <= radio
        ? `${tipo} a ${Math.round(distancia)} m de tu ubicación, registrado ${cuando} y aún abierto.`
        : `${tipo} en la misma calle y colonia (${reporte.ubicacion.referencia}), registrado ${cuando} y aún abierto.`;
    resultado.push({ reporte, distanciaMetros: Math.round(distancia), motivo });
  }
  return resultado.sort((a, b) => a.distanciaMetros - b.distanciaMetros);
}
