import { useMutation, useQuery } from "@tanstack/react-query";
import { CLAVES, invalidar, useContextoServicios } from "./comun";

export function useNotifications() {
  const { repos, actor } = useContextoServicios();
  return useQuery({ queryKey: [CLAVES.notificaciones, actor.id], queryFn: () => repos.notifications.list(actor) });
}

/** Número de notificaciones sin leer (0 mientras carga o si falla). */
export function useUnreadCount(): number {
  const { data } = useNotifications();
  return data?.filter((n) => !n.leida).length ?? 0;
}

export function useMarkRead() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: (id: string) => repos.notifications.markRead(id, actor),
    onSuccess: () => invalidar(cliente, CLAVES.notificaciones),
  });
}

export function useMarkAllRead() {
  const { repos, actor, cliente } = useContextoServicios();
  return useMutation({
    mutationFn: () => repos.notifications.markAllRead(actor),
    onSuccess: () => invalidar(cliente, CLAVES.notificaciones),
  });
}
