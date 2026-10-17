import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import type { DestinoAsignacion, FiltroBandeja, MotivoCancelacion, NuevaIncidenciaInput } from "@/types";
import { CLAVES, invalidar, useContextoServicios } from "./comun";

/**
 * Centro de operaciones. Todas las claves incluyen la identidad activa: el ámbito (coordinación o
 * dirección) cambia lo que devuelve el repositorio.
 */

/** Sólo consulta si la identidad puede entrar al Centro de operaciones (evita PermisoDemoError). */
function puedeConsultar(rol: string): boolean {
  return rol === "operador" || rol === "administracion";
}

export function useOperationAreas() {
  const { repos, actor } = useContextoServicios();
  return useQuery({
    queryKey: [CLAVES.incidencias, actor.id, "areas"],
    queryFn: () => repos.incidents.listAreas(actor),
    enabled: puedeConsultar(actor.rol),
    staleTime: 5 * 60_000,
  });
}

export function useOperationSummary() {
  const { repos, actor } = useContextoServicios();
  return useQuery({
    queryKey: [CLAVES.incidencias, actor.id, "resumen"],
    queryFn: () => repos.incidents.summary(actor),
    enabled: puedeConsultar(actor.rol),
  });
}

export function useIncidentInbox(filtro: FiltroBandeja = {}) {
  const { repos, actor } = useContextoServicios();
  return useQuery({
    queryKey: [CLAVES.incidencias, actor.id, "bandeja", filtro],
    queryFn: () => repos.incidents.list(filtro, actor),
    enabled: puedeConsultar(actor.rol),
    placeholderData: keepPreviousData,
  });
}

export function useIncident(id: string | undefined) {
  const { repos, actor } = useContextoServicios();
  return useQuery({
    queryKey: [CLAVES.incidencias, actor.id, "detalle", id],
    queryFn: () => repos.incidents.get(id ?? "", actor),
    enabled: Boolean(id) && puedeConsultar(actor.rol),
  });
}

export function useIncidentByFolio(folio: string | undefined) {
  const { repos, actor } = useContextoServicios();
  const texto = (folio ?? "").trim();
  return useQuery({
    queryKey: [CLAVES.incidencias, actor.id, "folio", texto],
    queryFn: () => repos.incidents.findByFolio(texto, actor),
    enabled: texto.length >= 4 && puedeConsultar(actor.rol),
  });
}

/** Un cambio operativo puede tocar el reporte ciudadano, sus puntos y sus notificaciones. */
const AFECTADAS = [CLAVES.incidencias, CLAVES.reportes, CLAVES.verificaciones, CLAVES.recompensas, CLAVES.notificaciones] as const;

export function useRegisterIncident() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: (input: NuevaIncidenciaInput) => repos.incidents.register(input, actor),
    onSuccess: () => invalidar(cliente, ...AFECTADAS),
  });
}

export function useReviewClassification() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: (id: string) => repos.incidents.reviewClassification(id, actor),
    onSuccess: () => invalidar(cliente, ...AFECTADAS),
  });
}

export function useConfirmAssignment() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: (input: { id: string; destino: DestinoAsignacion }) => repos.incidents.confirmAssignment(input.id, input.destino, actor),
    onSuccess: () => invalidar(cliente, ...AFECTADAS),
  });
}

export function useDiscardProposal() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: (input: { id: string; motivo: string }) => repos.incidents.discardProposal(input.id, input.motivo, actor),
    onSuccess: () => invalidar(cliente, ...AFECTADAS),
  });
}

export function useReturnToCoordination() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: (input: { id: string; motivo: string }) => repos.incidents.returnToCoordination(input.id, input.motivo, actor),
    onSuccess: () => invalidar(cliente, ...AFECTADAS),
  });
}

export function useRegisterIncidentAttention() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: (input: { id: string; nota: string }) => repos.incidents.registerAttention(input.id, input.nota, actor),
    onSuccess: () => invalidar(cliente, ...AFECTADAS),
  });
}

export function useCancelIncident() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: (input: { id: string; motivo: MotivoCancelacion }) => repos.incidents.cancel(input.id, input.motivo, actor),
    onSuccess: () => invalidar(cliente, ...AFECTADAS),
  });
}

export function useAddInternalNote() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: (input: { id: string; texto: string }) => repos.incidents.addInternalNote(input.id, input.texto, actor),
    onSuccess: () => invalidar(cliente, CLAVES.incidencias),
  });
}
