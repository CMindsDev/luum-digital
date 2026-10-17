import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import type { CategoriaReporte, FiltroReportes, MotivoCancelacion, NuevoReporteInput, Ubicacion } from "@/types";
import { CLAVES, invalidar, useContextoServicios } from "./comun";

export function useReports(filtro: FiltroReportes = {}) {
  const { repos } = useContextoServicios();
  return useQuery({
    queryKey: [CLAVES.reportes, "lista", filtro],
    queryFn: () => repos.reports.list(filtro),
    placeholderData: keepPreviousData,
  });
}

export function useReport(id: string | undefined) {
  const { repos } = useContextoServicios();
  return useQuery({ queryKey: [CLAVES.reportes, "detalle", id], queryFn: () => repos.reports.get(id ?? ""), enabled: Boolean(id) });
}

export function useReportByFolio(folio: string) {
  const { repos } = useContextoServicios();
  const texto = folio.trim();
  return useQuery({
    queryKey: [CLAVES.reportes, "folio", texto],
    queryFn: () => repos.reports.findByFolio(texto),
    enabled: texto.length >= 4,
  });
}

export function useMyReports() {
  const { repos, actor } = useContextoServicios();
  return useQuery({
    queryKey: [CLAVES.reportes, "mios", actor.id],
    queryFn: () => repos.reports.list({ identidadId: actor.id }),
  });
}

export function usePossibleDuplicates(input: { categoria: CategoriaReporte; ubicacion: Ubicacion } | null) {
  const { repos } = useContextoServicios();
  return useQuery({
    queryKey: [CLAVES.reportes, "duplicados", input],
    queryFn: () => repos.reports.findPossibleDuplicates(input!),
    enabled: input !== null,
  });
}

/** Tras cualquier cambio de reporte se refrescan reportes, puntos y notificaciones. */
const AFECTADAS = [CLAVES.reportes, CLAVES.verificaciones, CLAVES.recompensas, CLAVES.notificaciones] as const;

export function useCreateReport() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: (input: NuevoReporteInput) => repos.reports.create(input, actor),
    onSuccess: () => invalidar(cliente, ...AFECTADAS),
  });
}

export function useAddContribution() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: (input: { reporteId: string; descripcion: string; tieneFoto: boolean }) =>
      repos.reports.addContribution(input.reporteId, { descripcion: input.descripcion, tieneFoto: input.tieneFoto }, actor),
    onSuccess: () => invalidar(cliente, ...AFECTADAS),
  });
}

export function useValidateReport() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: (reporteId: string) => repos.reports.validate(reporteId, actor),
    onSuccess: () => invalidar(cliente, ...AFECTADAS),
  });
}

export function useRegisterAttention() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: (input: { reporteId: string; nota: string }) => repos.reports.registerAttention(input.reporteId, input.nota, actor),
    onSuccess: () => invalidar(cliente, ...AFECTADAS),
  });
}

export function useCancelReport() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: (input: { reporteId: string; motivo: MotivoCancelacion }) => repos.reports.cancel(input.reporteId, input.motivo, actor),
    onSuccess: () => invalidar(cliente, ...AFECTADAS),
  });
}
