import { ReglaDeNegocioError } from "@/services/contracts/errors";
import type { FechaISO, MovimientoPuntos, SaldoPuntos, TipoMovimiento } from "@/types";

/**
 * Libro mayor de puntos (lógica pura, sin almacenamiento).
 *
 * Reglas (AGENTS.md §2.8):
 * - Los créditos nacen "pendiente" y sólo cuentan en el saldo al pasar a "aprobado" (validación simulada).
 * - Idempotencia estricta por `claveEvento`: el mismo evento nunca genera dos movimientos.
 * - Un crédito pendiente se cancela (no suma); uno aprobado se revierte con un movimiento negativo
 *   y un motivo obligatorio (el historial es de sólo anexar).
 * - El saldo disponible es la suma de movimientos "aprobado". Un canje nunca deja saldo negativo.
 */

export type LibroMayor = readonly MovimientoPuntos[];

export interface NuevoCredito {
  id: string;
  identidadId: string;
  claveEvento: string;
  tipo: Extract<TipoMovimiento, "reporte_validado" | "verificacion_aprobada">;
  puntos: number;
  motivo: string;
  fecha: FechaISO;
  estado: "pendiente" | "aprobado";
  referenciaId?: string;
}

export interface ResultadoLibro {
  libro: MovimientoPuntos[];
  movimiento: MovimientoPuntos | null;
  /** false cuando la operación ya se había aplicado (idempotencia) o no aplicaba. */
  cambio: boolean;
}

function exigirMotivo(motivo: string): string {
  const limpio = motivo.trim();
  if (!limpio) throw new ReglaDeNegocioError("motivo_obligatorio", "Toda reversión o cancelación de puntos necesita un motivo.");
  return limpio;
}

export function buscarPorClave(libro: LibroMayor, claveEvento: string): MovimientoPuntos | undefined {
  return libro.find((movimiento) => movimiento.claveEvento === claveEvento);
}

/** Registra un crédito. Si ya existe un movimiento con la misma clave, no hace nada. */
export function registrarCredito(libro: LibroMayor, credito: NuevoCredito): ResultadoLibro {
  const existente = buscarPorClave(libro, credito.claveEvento);
  if (existente) return { libro: [...libro], movimiento: existente, cambio: false };
  if (!Number.isFinite(credito.puntos) || credito.puntos < 0) {
    throw new ReglaDeNegocioError("puntos_invalidos", "Un crédito de puntos no puede ser negativo.");
  }
  const movimiento: MovimientoPuntos = {
    id: credito.id,
    identidadId: credito.identidadId,
    claveEvento: credito.claveEvento,
    tipo: credito.tipo,
    puntos: Math.round(credito.puntos),
    estado: credito.estado,
    motivo: exigirMotivo(credito.motivo),
    fecha: credito.fecha,
    ...(credito.referenciaId ? { referenciaId: credito.referenciaId } : {}),
  };
  return { libro: [...libro, movimiento], movimiento, cambio: true };
}

/** pendiente -> aprobado. Aprobar dos veces no duplica nada. */
export function aprobarCredito(libro: LibroMayor, claveEvento: string, fecha: FechaISO): ResultadoLibro {
  const existente = buscarPorClave(libro, claveEvento);
  if (!existente || existente.estado !== "pendiente") {
    return { libro: [...libro], movimiento: existente ?? null, cambio: false };
  }
  const aprobado: MovimientoPuntos = { ...existente, estado: "aprobado", fecha };
  return { libro: libro.map((m) => (m.id === existente.id ? aprobado : m)), movimiento: aprobado, cambio: true };
}

/** pendiente -> cancelado (no suma). Requiere motivo. */
export function cancelarCredito(libro: LibroMayor, claveEvento: string, motivo: string): ResultadoLibro {
  const texto = exigirMotivo(motivo);
  const existente = buscarPorClave(libro, claveEvento);
  if (!existente || existente.estado !== "pendiente") {
    return { libro: [...libro], movimiento: existente ?? null, cambio: false };
  }
  const cancelado: MovimientoPuntos = { ...existente, estado: "cancelado", motivo: `${existente.motivo} · Cancelado: ${texto}` };
  return { libro: libro.map((m) => (m.id === existente.id ? cancelado : m)), movimiento: cancelado, cambio: true };
}

export function claveReversion(claveEvento: string): string {
  return `${claveEvento}:reversion`;
}

/**
 * Revierte un crédito aprobado con un movimiento negativo (tipo "reversion", motivo obligatorio).
 * Idempotente: revertir dos veces el mismo evento no descuenta dos veces.
 */
export function revertirCredito(
  libro: LibroMayor,
  claveEvento: string,
  datos: { id: string; motivo: string; fecha: FechaISO },
): ResultadoLibro {
  const motivo = exigirMotivo(datos.motivo);
  const original = buscarPorClave(libro, claveEvento);
  if (!original || original.estado !== "aprobado" || original.puntos <= 0) {
    return { libro: [...libro], movimiento: null, cambio: false };
  }
  const clave = claveReversion(claveEvento);
  const yaRevertido = buscarPorClave(libro, clave);
  if (yaRevertido) return { libro: [...libro], movimiento: yaRevertido, cambio: false };
  const reversion: MovimientoPuntos = {
    id: datos.id,
    identidadId: original.identidadId,
    claveEvento: clave,
    tipo: "reversion",
    puntos: -original.puntos,
    estado: "aprobado",
    motivo,
    fecha: datos.fecha,
    ...(original.referenciaId ? { referenciaId: original.referenciaId } : {}),
  };
  return { libro: [...libro, reversion], movimiento: reversion, cambio: true };
}

/**
 * Deshace todo lo asociado a una referencia (p. ej. un reporte cancelado): cancela los pendientes y
 * revierte los aprobados. Devuelve el libro y los movimientos afectados.
 */
export function anularPorReferencia(
  libro: LibroMayor,
  referenciaId: string,
  datos: { motivo: string; fecha: FechaISO; nuevoId: () => string },
): { libro: MovimientoPuntos[]; afectados: MovimientoPuntos[] } {
  const motivo = exigirMotivo(datos.motivo);
  let actual: MovimientoPuntos[] = [...libro];
  const afectados: MovimientoPuntos[] = [];
  const creditos = libro.filter(
    (m) => m.referenciaId === referenciaId && (m.tipo === "reporte_validado" || m.tipo === "verificacion_aprobada"),
  );
  for (const credito of creditos) {
    if (credito.estado === "pendiente") {
      const r = cancelarCredito(actual, credito.claveEvento, motivo);
      actual = r.libro;
      if (r.cambio && r.movimiento) afectados.push(r.movimiento);
    } else if (credito.estado === "aprobado") {
      const r = revertirCredito(actual, credito.claveEvento, { id: datos.nuevoId(), motivo, fecha: datos.fecha });
      actual = r.libro;
      if (r.cambio && r.movimiento) afectados.push(r.movimiento);
    }
  }
  return { libro: actual, afectados };
}

/** Movimientos de una identidad, del más reciente al más antiguo. */
export function movimientosDe(libro: LibroMayor, identidadId: string): MovimientoPuntos[] {
  return libro
    .filter((m) => m.identidadId === identidadId)
    .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));
}

export function calcularSaldo(libro: LibroMayor, identidadId: string): SaldoPuntos {
  let disponible = 0;
  let pendientes = 0;
  let totalCanjeado = 0;
  for (const m of libro) {
    if (m.identidadId !== identidadId) continue;
    if (m.estado === "aprobado") {
      disponible += m.puntos;
      if (m.tipo === "canje") totalCanjeado += Math.abs(m.puntos);
    } else if (m.estado === "pendiente" && m.puntos > 0) {
      pendientes += m.puntos;
    }
  }
  return { disponible, pendientes, totalCanjeado };
}

/**
 * Registra un canje (débito aprobado). Lanza ReglaDeNegocioError("saldo_insuficiente") si el saldo
 * disponible no alcanza: nunca deja el saldo en negativo. Idempotente por claveEvento.
 */
export function registrarCanje(
  libro: LibroMayor,
  canje: { id: string; identidadId: string; claveEvento: string; costo: number; motivo: string; fecha: FechaISO; referenciaId?: string },
): ResultadoLibro {
  const existente = buscarPorClave(libro, canje.claveEvento);
  if (existente) return { libro: [...libro], movimiento: existente, cambio: false };
  if (!Number.isInteger(canje.costo) || canje.costo <= 0) {
    throw new ReglaDeNegocioError("costo_invalido", "El costo del beneficio debe ser un número entero positivo.");
  }
  const { disponible } = calcularSaldo(libro, canje.identidadId);
  if (disponible < canje.costo) {
    throw new ReglaDeNegocioError(
      "saldo_insuficiente",
      `Te faltan ${canje.costo - Math.max(disponible, 0)} puntos aprobados para este beneficio de ejemplo.`,
    );
  }
  const movimiento: MovimientoPuntos = {
    id: canje.id,
    identidadId: canje.identidadId,
    claveEvento: canje.claveEvento,
    tipo: "canje",
    puntos: -canje.costo,
    estado: "aprobado",
    motivo: exigirMotivo(canje.motivo),
    fecha: canje.fecha,
    ...(canje.referenciaId ? { referenciaId: canje.referenciaId } : {}),
  };
  return { libro: [...libro, movimiento], movimiento, cambio: true };
}

/** Totales globales del libro (para el panel de administración de demostración). */
export function totalesLibro(libro: LibroMayor): { aprobados: number; pendientes: number; canjeados: number; revertidos: number } {
  let aprobados = 0;
  let pendientes = 0;
  let canjeados = 0;
  let revertidos = 0;
  for (const m of libro) {
    if (m.estado === "pendiente") pendientes += m.puntos;
    if (m.estado !== "aprobado") continue;
    if (m.tipo === "canje") canjeados += Math.abs(m.puntos);
    else if (m.tipo === "reversion") revertidos += Math.abs(m.puntos);
    else aprobados += m.puntos;
  }
  return { aprobados, pendientes, canjeados, revertidos };
}
