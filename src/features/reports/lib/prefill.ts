import { esCategoriaReporte } from "@/domain/reportes";
import type { PrefillAsistente } from "@/types";

export type PrefillReporte = Extract<PrefillAsistente, { tipo: "reporte" }>;

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

function textoOpcional(valor: unknown, maximo: number): string | undefined {
  if (typeof valor !== "string") return undefined;
  const limpio = valor.trim();
  return limpio ? limpio.slice(0, maximo) : undefined;
}

/**
 * Lee `location.state.prefill` (src/types/asistente.ts) sin confiar en su forma: sólo acepta un
 * prefill de reporte con categoría válida y origen «asistente». El formulario lo muestra como
 * «Preparado por el asistente: revisa y confirma» y nunca lo envía solo.
 */
export function leerPrefillReporte(estado: unknown): PrefillReporte | null {
  if (!esObjeto(estado) || !esObjeto(estado.prefill)) return null;
  const { tipo, categoria, origen, descripcion, referenciaUbicacion } = estado.prefill;
  if (tipo !== "reporte" || origen !== "asistente" || typeof categoria !== "string" || !esCategoriaReporte(categoria)) return null;
  const textoDescripcion = textoOpcional(descripcion, 300);
  const textoReferencia = textoOpcional(referenciaUbicacion, 160);
  return {
    tipo: "reporte",
    categoria,
    origen: "asistente",
    ...(textoDescripcion ? { descripcion: textoDescripcion } : {}),
    ...(textoReferencia ? { referenciaUbicacion: textoReferencia } : {}),
  };
}
