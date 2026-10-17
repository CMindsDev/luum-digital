import { useMutation, useQuery } from "@tanstack/react-query";
import type { NuevaVerificacionInput } from "@/types";
import { CLAVES, invalidar, useContextoServicios } from "./comun";

const AFECTADAS = [CLAVES.verificaciones, CLAVES.reportes, CLAVES.recompensas, CLAVES.notificaciones] as const;

export function useVerifiableReports() {
  const { repos, actor } = useContextoServicios();
  return useQuery({ queryKey: [CLAVES.verificaciones, actor.id, "verificables"], queryFn: () => repos.verifications.listVerifiable(actor) });
}

export function useMyVerifications() {
  const { repos, actor } = useContextoServicios();
  return useQuery({ queryKey: [CLAVES.verificaciones, actor.id, "mias"], queryFn: () => repos.verifications.listMine(actor) });
}

export function useReportVerifications(reporteId: string | undefined) {
  const { repos } = useContextoServicios();
  return useQuery({
    queryKey: [CLAVES.verificaciones, "reporte", reporteId],
    queryFn: () => repos.verifications.listByReport(reporteId ?? ""),
    enabled: Boolean(reporteId),
  });
}

export function useSubmitVerification() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: (input: NuevaVerificacionInput) => repos.verifications.submit(input, actor),
    onSuccess: () => invalidar(cliente, ...AFECTADAS),
  });
}

export function useVerificationsForReview() {
  const { repos, actor } = useContextoServicios();
  const esOperador = actor.rol === "operador" || actor.rol === "administracion";
  return useQuery({
    queryKey: [CLAVES.verificaciones, actor.id, "revision"],
    queryFn: () => repos.verifications.listForReview(actor),
    enabled: esOperador,
  });
}

export function useApproveVerification() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: (id: string) => repos.verifications.approve(id, actor),
    onSuccess: () => invalidar(cliente, ...AFECTADAS),
  });
}

export function useRejectVerification() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: (input: { id: string; motivo: string }) => repos.verifications.reject(input.id, input.motivo, actor),
    onSuccess: () => invalidar(cliente, ...AFECTADAS),
  });
}

export function useRevertVerification() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: (input: { id: string; motivo: string }) => repos.verifications.revert(input.id, input.motivo, actor),
    onSuccess: () => invalidar(cliente, ...AFECTADAS),
  });
}
