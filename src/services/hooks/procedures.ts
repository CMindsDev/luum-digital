import { useMutation, useQuery } from "@tanstack/react-query";
import type { BorradorGestionInput, PagoDemo } from "@/types";
import { CLAVES, invalidar, useContextoServicios } from "./comun";

export function useProcedures() {
  const { repos, actor } = useContextoServicios();
  return useQuery({ queryKey: [CLAVES.gestiones, actor.id, "lista"], queryFn: () => repos.procedures.list(actor) });
}

export function useProcedure(id: string | undefined) {
  const { repos, actor } = useContextoServicios();
  return useQuery({
    queryKey: [CLAVES.gestiones, actor.id, "detalle", id],
    queryFn: () => repos.procedures.get(id ?? "", actor),
    enabled: Boolean(id),
  });
}

export function useProcedureByFolio(folio: string) {
  const { repos, actor } = useContextoServicios();
  const texto = folio.trim();
  return useQuery({
    queryKey: [CLAVES.gestiones, actor.id, "folio", texto],
    queryFn: () => repos.procedures.findByFolio(texto, actor),
    enabled: texto.length >= 4,
  });
}

export function useSaveDraft() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: (input: Omit<BorradorGestionInput, "identidadId">) => repos.procedures.saveDraft({ ...input, identidadId: actor.id }, actor),
    onSuccess: () => invalidar(cliente, CLAVES.gestiones),
  });
}

export function useSubmitProcedure() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: (id: string) => repos.procedures.submit(id, actor),
    onSuccess: () => invalidar(cliente, CLAVES.gestiones, CLAVES.notificaciones),
  });
}

export function useCancelProcedure() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: (id: string) => repos.procedures.cancel(id, actor),
    onSuccess: () => invalidar(cliente, CLAVES.gestiones),
  });
}

export function useSimulatePayment() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: (input: {
      gestionId?: string;
      concepto: string;
      montoDemo: number;
      metodo: PagoDemo["metodo"];
      resultado?: "aprobado" | "rechazado";
    }) => repos.procedures.simulatePayment(input, actor),
    onSuccess: () => invalidar(cliente, CLAVES.gestiones),
  });
}

export function useRequestAppointment() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: (input: { servicioId: string; fecha: string; hora: string; sede: string }) => repos.procedures.requestAppointment(input, actor),
    onSuccess: () => invalidar(cliente, CLAVES.gestiones, CLAVES.notificaciones),
  });
}
