/**
 * Folios de demostración. ÚNICO lugar donde se generan identificadores visibles DEMO-…
 *
 * - Reportes: DEMO-R-####### (7 dígitos, como el folio numérico de Mérida Móvil, con prefijo DEMO).
 * - Gestiones DEMO-G-, pagos DEMO-P-, citas DEMO-C-, canjes DEMO-B-.
 * - Solicitudes de apoyo simuladas DEMO-S-: se generan en memoria y nunca se persisten
 *   (bienestar no deja rastro en el almacenamiento).
 *
 * El contador es monotónico y se persiste con los datos de la demostración: un folio nunca se reutiliza.
 */

export type TipoFolio = "reporte" | "gestion" | "pago" | "cita" | "canje";

export const PREFIJOS_FOLIO: Record<TipoFolio, string> = {
  reporte: "DEMO-R-",
  gestion: "DEMO-G-",
  pago: "DEMO-P-",
  cita: "DEMO-C-",
  canje: "DEMO-B-",
};

export const DIGITOS_FOLIO = 7;

export type ContadoresFolio = Record<TipoFolio, number>;

export const CONTADORES_INICIALES: ContadoresFolio = {
  reporte: 0,
  gestion: 0,
  pago: 0,
  cita: 0,
  canje: 0,
};

export function formatearFolio(tipo: TipoFolio, numero: number): string {
  if (!Number.isInteger(numero) || numero < 1) throw new RangeError("El número de folio debe ser un entero positivo.");
  return `${PREFIJOS_FOLIO[tipo]}${String(numero).padStart(DIGITOS_FOLIO, "0")}`;
}

/**
 * Devuelve el siguiente folio y los contadores actualizados (función pura).
 * Si se pasan folios existentes, salta cualquier número ya usado (defensa ante datos importados).
 */
export function siguienteFolio(
  contadores: ContadoresFolio,
  tipo: TipoFolio,
  existentes?: ReadonlySet<string>,
): { folio: string; contadores: ContadoresFolio } {
  let numero = contadores[tipo] + 1;
  let folio = formatearFolio(tipo, numero);
  while (existentes?.has(folio)) {
    numero += 1;
    folio = formatearFolio(tipo, numero);
  }
  return { folio, contadores: { ...contadores, [tipo]: numero } };
}

const PATRON_FOLIO = /^DEMO-([RGPCBS])-(\d{7})$/;

const TIPO_POR_LETRA: Record<string, TipoFolio | "apoyo"> = {
  R: "reporte",
  G: "gestion",
  P: "pago",
  C: "cita",
  B: "canje",
  S: "apoyo",
};

/** Normaliza lo que escribe la persona: mayúsculas, sin espacios, guiones opcionales. */
export function normalizarFolio(entrada: string): string {
  const limpio = entrada.trim().toUpperCase().replace(/\s+/g, "").replace(/[–—_]/g, "-");
  const compacto = /^DEMO-?([RGPCBS])-?(\d{1,7})$/.exec(limpio);
  if (!compacto) return limpio;
  const [, letra = "", digitos = ""] = compacto;
  return `DEMO-${letra}-${digitos.padStart(DIGITOS_FOLIO, "0")}`;
}

export function esFolioDemo(texto: string): boolean {
  return PATRON_FOLIO.test(normalizarFolio(texto));
}

/** Tipo del folio (o null si no tiene el formato DEMO). */
export function tipoDeFolio(texto: string): TipoFolio | "apoyo" | null {
  const coincidencia = PATRON_FOLIO.exec(normalizarFolio(texto));
  if (!coincidencia) return null;
  return TIPO_POR_LETRA[coincidencia[1] ?? ""] ?? null;
}

/** Busca un folio DEMO dentro de un texto libre («mi folio es demo-r-0000012»). */
export function extraerFolio(texto: string): string | null {
  const coincidencia = /DEMO[\s-]?[RGPCB][\s-]?\d{1,7}/i.exec(texto);
  if (!coincidencia) return null;
  const folio = normalizarFolio(coincidencia[0].replace(/\s/g, "-"));
  return PATRON_FOLIO.test(folio) ? folio : null;
}

let contadorApoyoEnMemoria = 0;

/** Referencia de una solicitud de apoyo simulada. Sólo en memoria: no se persiste ni se registra. */
export function referenciaApoyoSimulada(): string {
  contadorApoyoEnMemoria += 1;
  return `DEMO-S-${String(contadorApoyoEnMemoria).padStart(DIGITOS_FOLIO, "0")}`;
}
