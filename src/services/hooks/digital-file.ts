import { useMutation, useQuery } from "@tanstack/react-query";
import type { PreferenciasPrivacidad } from "@/types";
import { CLAVES, invalidar, useContextoServicios } from "./comun";

export function useProfile() {
  const { repos, actor } = useContextoServicios();
  return useQuery({ queryKey: [CLAVES.expediente, actor.id, "perfil"], queryFn: () => repos.digitalFile.getProfile(actor) });
}

export function useDocuments() {
  const { repos, actor } = useContextoServicios();
  return useQuery({ queryKey: [CLAVES.expediente, actor.id, "documentos"], queryFn: () => repos.digitalFile.listDocuments(actor) });
}

export function useDocument(id: string | undefined) {
  const { repos, actor } = useContextoServicios();
  return useQuery({
    queryKey: [CLAVES.expediente, actor.id, "documento", id],
    queryFn: () => repos.digitalFile.getDocument(id ?? "", actor),
    enabled: Boolean(id),
  });
}

export function useReusableFields() {
  const { repos, actor } = useContextoServicios();
  return useQuery({ queryKey: [CLAVES.expediente, actor.id, "reutilizables"], queryFn: () => repos.digitalFile.listReusableFields(actor) });
}

export function usePrivacy() {
  const { repos, actor } = useContextoServicios();
  return useQuery({ queryKey: [CLAVES.expediente, actor.id, "privacidad"], queryFn: () => repos.digitalFile.getPrivacy(actor) });
}

export function useUpdatePrivacy() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: (cambios: Partial<Omit<PreferenciasPrivacidad, "confirmarAntesDeReutilizar">>) => repos.digitalFile.updatePrivacy(cambios, actor),
    onSuccess: () => invalidar(cliente, CLAVES.expediente),
  });
}
