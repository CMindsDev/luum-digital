/**
 * Formato de fechas en español de México.
 * - Las fechas sin hora (AAAA-MM-DD, como `fechaConsulta`) se muestran tal cual, sin desfase por zona horaria.
 * - Las fechas con hora se muestran en la hora de Mérida (America/Merida).
 */
const ZONA_MERIDA = "America/Merida";
const SOLO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

export type EstiloFecha = "corta" | "media" | "larga";

const ESTILOS: Record<EstiloFecha, Intl.DateTimeFormatOptions> = {
  corta: { day: "numeric", month: "short", year: "numeric" },
  media: { day: "numeric", month: "long", year: "numeric" },
  larga: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
};

function aFecha(valor: string): { fecha: Date; soloFecha: boolean } | null {
  const coincidencia = SOLO_FECHA.exec(valor);
  if (coincidencia) {
    const [, anio, mes, dia] = coincidencia;
    return { fecha: new Date(Date.UTC(Number(anio), Number(mes) - 1, Number(dia))), soloFecha: true };
  }
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : { fecha, soloFecha: false };
}

/** «17 oct 2026», «17 de octubre de 2026» o «sábado, 17 de octubre de 2026». Devuelve el texto original si no es fecha. */
export function formatearFecha(valor: string, estilo: EstiloFecha = "corta"): string {
  const resultado = aFecha(valor);
  if (!resultado) return valor;
  return new Intl.DateTimeFormat("es-MX", {
    ...ESTILOS[estilo],
    timeZone: resultado.soloFecha ? "UTC" : ZONA_MERIDA,
  }).format(resultado.fecha);
}

/** «17 oct 2026, 10:45». */
export function formatearFechaHora(valor: string): string {
  const resultado = aFecha(valor);
  if (!resultado) return valor;
  if (resultado.soloFecha) return formatearFecha(valor);
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ZONA_MERIDA,
  }).format(resultado.fecha);
}
