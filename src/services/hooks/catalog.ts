import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { FiltroCatalogo } from "@/types";
import { CLAVES, useContextoServicios } from "./comun";

export function useCategories() {
  const { repos } = useContextoServicios();
  return useQuery({ queryKey: [CLAVES.catalogo, "categorias"], queryFn: () => repos.catalog.listCategories(), staleTime: Infinity });
}

export function useServices(filtro: FiltroCatalogo = {}) {
  const { repos } = useContextoServicios();
  return useQuery({
    queryKey: [CLAVES.catalogo, "lista", filtro],
    queryFn: () => repos.catalog.list(filtro),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
}

export function useService(id: string | undefined) {
  const { repos } = useContextoServicios();
  return useQuery({
    queryKey: [CLAVES.catalogo, "servicio", id],
    queryFn: () => repos.catalog.get(id ?? ""),
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
  });
}

export function useCatalogSearch(consulta: string) {
  const { repos } = useContextoServicios();
  const texto = consulta.trim();
  return useQuery({
    queryKey: [CLAVES.catalogo, "busqueda", texto],
    queryFn: () => repos.catalog.search(texto),
    enabled: texto.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
}

export function useCoverage() {
  const { repos } = useContextoServicios();
  return useQuery({ queryKey: [CLAVES.catalogo, "cobertura"], queryFn: () => repos.catalog.coverage(), staleTime: Infinity });
}
