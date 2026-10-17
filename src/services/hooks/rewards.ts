import { useMutation, useQuery } from "@tanstack/react-query";
import { CLAVES, invalidar, useContextoServicios } from "./comun";

export function useRewardRules() {
  const { repos } = useContextoServicios();
  return useQuery({ queryKey: [CLAVES.recompensas, "reglas"], queryFn: () => repos.rewards.getRules(), staleTime: Infinity });
}

export function useBalance() {
  const { repos, actor } = useContextoServicios();
  return useQuery({ queryKey: [CLAVES.recompensas, actor.id, "saldo"], queryFn: () => repos.rewards.getBalance(actor) });
}

export function useMovements() {
  const { repos, actor } = useContextoServicios();
  return useQuery({ queryKey: [CLAVES.recompensas, actor.id, "movimientos"], queryFn: () => repos.rewards.listMovements(actor) });
}

export function useBenefits() {
  const { repos } = useContextoServicios();
  return useQuery({ queryKey: [CLAVES.recompensas, "beneficios"], queryFn: () => repos.rewards.listBenefits() });
}

export function useRedemptions() {
  const { repos, actor } = useContextoServicios();
  return useQuery({ queryKey: [CLAVES.recompensas, actor.id, "canjes"], queryFn: () => repos.rewards.listRedemptions(actor) });
}

export function useRedeem() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: (beneficioId: string) => repos.rewards.redeem(beneficioId, actor),
    onSuccess: () => invalidar(cliente, CLAVES.recompensas, CLAVES.notificaciones),
  });
}
