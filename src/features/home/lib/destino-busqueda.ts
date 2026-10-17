import { detectarIntencion } from "@/domain/intencion";

/**
 * Privacidad (AGENTS.md §7): una consulta sobre salud mental o violencia no viaja en la URL.
 * Se pasa en el estado del historial de esta pestaña (no se comparte al copiar el enlace, no llega
 * a ningún servidor y no se guarda en localStorage). Las demás consultas usan /buscar?q=.
 */
export const LARGO_MAXIMO_CONSULTA = 160;

export interface EstadoBusqueda {
  consulta: string;
}

export interface DestinoBusqueda {
  to: string;
  state?: EstadoBusqueda;
}

export function esConsultaSensible(consulta: string): boolean {
  const texto = consulta.trim();
  if (!texto) return false;
  const { intencion } = detectarIntencion(texto);
  return intencion === "ayuda_inmediata" || intencion === "apoyo_psicologico";
}

export function destinoDeBusqueda(consulta: string): DestinoBusqueda {
  const texto = consulta.trim().slice(0, LARGO_MAXIMO_CONSULTA);
  if (!texto) return { to: "/buscar" };
  if (esConsultaSensible(texto)) return { to: "/buscar", state: { consulta: texto } };
  return { to: `/buscar?q=${encodeURIComponent(texto)}` };
}

/** Lee la consulta del estado del historial (si la hay y es válida). */
export function consultaDelEstado(estado: unknown): string | null {
  if (typeof estado !== "object" || estado === null || !("consulta" in estado)) return null;
  const consulta: unknown = estado.consulta;
  return typeof consulta === "string" ? consulta.slice(0, LARGO_MAXIMO_CONSULTA) : null;
}
