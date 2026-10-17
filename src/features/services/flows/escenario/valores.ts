import type { CampoEscenario } from "@/components/catalogo/datos-demo";
import type { CampoReutilizable, Gestion } from "@/types";

export { valorParaMostrar } from "@/components/catalogo/mostrar-valor";

/**
 * Lógica pura de los formularios simulados (escenarios de src/data/recorridos-demo.ts):
 * valores iniciales, conversión a `Gestion.datos`, reutilización de datos del expediente y
 * presentación de valores en la revisión.
 */

export type ValorCampo = string | boolean;
export type ValoresFormulario = Record<string, ValorCampo>;
export type DatosGestion = Gestion["datos"];

/** Valores iniciales: vacíos o los de un borrador (nunca datos inventados). */
export function valoresIniciales(campos: readonly CampoEscenario[], datos?: DatosGestion): ValoresFormulario {
  const valores: ValoresFormulario = {};
  for (const campo of campos) {
    const previo = datos?.[campo.nombre];
    if (campo.tipo === "casilla") valores[campo.nombre] = previo === true;
    else valores[campo.nombre] = previo === null || previo === undefined || typeof previo === "boolean" ? "" : String(previo);
  }
  return valores;
}

/** Convierte valores (crudos o validados por zod) a `Gestion.datos`, sólo con los campos del escenario. */
export function aDatosGestion(valores: Record<string, unknown>, campos: readonly CampoEscenario[]): DatosGestion {
  const datos: DatosGestion = {};
  for (const campo of campos) {
    const valor = valores[campo.nombre];
    if (typeof valor === "string") datos[campo.nombre] = valor.trim() === "" ? null : valor.trim();
    else if (typeof valor === "number" && Number.isFinite(valor)) datos[campo.nombre] = valor;
    else if (typeof valor === "boolean") datos[campo.nombre] = valor;
    else datos[campo.nombre] = null;
  }
  return datos;
}

export interface CampoParaReutilizar {
  campo: CampoEscenario;
  /** Dato del expediente ficticio; null si el expediente no lo tiene. */
  dato: CampoReutilizable | null;
}

/** Campos del escenario que pueden tomarse del Expediente Digital ficticio, con su dato disponible. */
export function camposParaReutilizar(campos: readonly CampoEscenario[], disponibles: readonly CampoReutilizable[]): CampoParaReutilizar[] {
  return campos
    .filter((campo) => campo.reutilizable !== undefined)
    .map((campo) => ({
      campo,
      dato: disponibles.find((disponible) => disponible.campo === campo.reutilizable && disponible.valor.trim() !== "") ?? null,
    }));
}

/**
 * Campos que siguen teniendo exactamente el valor copiado del expediente (si la persona lo editó,
 * deja de contarse como reutilizado).
 */
export function reutilizadosVigentes(copiados: Readonly<Record<string, string>>, valores: Record<string, unknown>): string[] {
  return Object.entries(copiados)
    .filter(([nombre, copiado]) => {
      const actual = valores[nombre];
      return typeof actual === "string" && actual.trim() === copiado.trim();
    })
    .map(([nombre]) => nombre);
}

/** Fecha mínima (mañana, AAAA-MM-DD en hora local) para solicitudes de cita simuladas. */
export function fechaMinimaCita(hoy: Date = new Date()): string {
  const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
  const mes = String(manana.getMonth() + 1).padStart(2, "0");
  const dia = String(manana.getDate()).padStart(2, "0");
  return `${manana.getFullYear()}-${mes}-${dia}`;
}
