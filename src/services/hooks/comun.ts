import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useActiveIdentity } from "@/app/session/store";
import { useRepositories } from "@/services/repositories-context";

/** Raíces de claves de consulta. Todas las claves con datos personales incluyen la identidad activa. */
export const CLAVES = {
  catalogo: "catalogo",
  busquedaInteligente: "busqueda-inteligente",
  gestiones: "gestiones",
  reportes: "reportes",
  verificaciones: "verificaciones",
  recompensas: "recompensas",
  expediente: "expediente",
  bienestar: "bienestar",
  notificaciones: "notificaciones",
  incidencias: "incidencias",
} as const;

export type RaizClave = (typeof CLAVES)[keyof typeof CLAVES];

export function invalidar(cliente: QueryClient, ...raices: RaizClave[]): Promise<void> {
  return Promise.all(raices.map((raiz) => cliente.invalidateQueries({ queryKey: [raiz] }))).then(() => undefined);
}

/** Repositorios, identidad activa y cliente de consultas en un solo lugar. */
export function useContextoServicios() {
  return { repos: useRepositories(), actor: useActiveIdentity(), cliente: useQueryClient() };
}
