import { useMutation, useQuery } from "@tanstack/react-query";
import type { AreaBienestar, SolicitudApoyoDemo } from "@/types";
import { CLAVES, useContextoServicios } from "./comun";

export function usePrograms(area?: AreaBienestar) {
  const { repos } = useContextoServicios();
  return useQuery({ queryKey: [CLAVES.bienestar, "programas", area ?? "todas"], queryFn: () => repos.wellbeing.listPrograms(area), staleTime: Infinity });
}

export function useHelpLines() {
  const { repos } = useContextoServicios();
  return useQuery({ queryKey: [CLAVES.bienestar, "lineas"], queryFn: () => repos.wellbeing.listHelpLines(), staleTime: Infinity });
}

export function useServiceLocations() {
  const { repos } = useContextoServicios();
  return useQuery({ queryKey: [CLAVES.bienestar, "ubicaciones"], queryFn: () => repos.wellbeing.listServiceLocations(), staleTime: Infinity });
}

/** Solicitud simulada: no se guarda ni se invalida nada (bienestar no persiste datos). */
export function useRequestSupportDemo() {
  const { repos } = useContextoServicios();
  return useMutation({ mutationFn: (tipo: SolicitudApoyoDemo["tipo"]) => repos.wellbeing.requestSupportDemo(tipo) });
}

export function useAggregatedDemand() {
  const { repos, actor } = useContextoServicios();
  const permitido = actor.rol === "operador" || actor.rol === "administracion";
  return useQuery({
    queryKey: [CLAVES.bienestar, actor.id, "demanda"],
    queryFn: () => repos.wellbeing.getAggregatedDemand(actor),
    enabled: permitido,
  });
}
