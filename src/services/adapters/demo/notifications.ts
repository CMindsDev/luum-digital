import type { NotificationRepository } from "@/services/contracts";
import { porFechaDesc } from "./comun";
import { operacionDemo, type ContextoDemo } from "./storage";

export function crearNotificacionesDemo(contexto: ContextoDemo): NotificationRepository {
  const { almacen } = contexto;
  return {
    list: (actor) =>
      operacionDemo(contexto, "notifications", "lectura", () =>
        almacen
          .leer("notificaciones")
          .filter((n) => n.identidadId === actor.id)
          .sort(porFechaDesc((n) => n.fecha)),
      ),

    markRead: (id, actor) =>
      operacionDemo(contexto, "notifications", "mutacion", () => {
        almacen.modificar("notificaciones", (lista) => ({
          valor: lista.map((n) => (n.id === id && n.identidadId === actor.id ? { ...n, leida: true } : n)),
          resultado: undefined,
        }));
      }),

    markAllRead: (actor) =>
      operacionDemo(contexto, "notifications", "mutacion", () => {
        almacen.modificar("notificaciones", (lista) => ({
          valor: lista.map((n) => (n.identidadId === actor.id ? { ...n, leida: true } : n)),
          resultado: undefined,
        }));
      }),
  };
}
