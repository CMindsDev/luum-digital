import type { PrefillAsistente } from "@/types";

/**
 * Lee el `prefill` que deja el asistente al preparar una pantalla (navigate con state.prefill).
 * Sólo se acepta el de tipo «tramite» del mismo servicio: la pantalla avisa y la persona confirma.
 */
export function leerPrefillTramite(estado: unknown, servicioId: string): Extract<PrefillAsistente, { tipo: "tramite" }> | null {
  if (typeof estado !== "object" || estado === null) return null;
  const prefill: unknown = Reflect.get(estado, "prefill");
  if (typeof prefill !== "object" || prefill === null) return null;
  const tipo: unknown = Reflect.get(prefill, "tipo");
  const id: unknown = Reflect.get(prefill, "servicioId");
  const origen: unknown = Reflect.get(prefill, "origen");
  if (tipo !== "tramite" || origen !== "asistente" || typeof id !== "string") return null;
  return id === servicioId ? { tipo: "tramite", servicioId: id, origen: "asistente" } : null;
}
