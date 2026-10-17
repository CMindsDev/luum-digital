import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { crearRepositoriosDemo } from "@/services/adapters/demo";
import type { Repositories } from "@/services/contracts";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { Notificacion } from "@/types";
import NotificationsPage from "./NotificationsPage";

const SENSIBLE: Notificacion = {
  id: "not-sensible",
  identidadId: "ana",
  fecha: "2026-10-17T15:00:00.000Z",
  tipo: "gestion",
  titulo: "Detalle privado de prueba",
  cuerpo: "Contenido que no debe verse en la vista previa.",
  enlace: "/gestiones",
  leida: false,
  sensible: true,
};

function conNotificaciones(lista: Notificacion[]): Repositories {
  const base = crearRepositoriosDemo();
  let estado = [...lista];
  return {
    ...base,
    notifications: {
      list: async () => estado,
      markRead: async (id) => {
        estado = estado.map((n) => (n.id === id ? { ...n, leida: true } : n));
      },
      markAllRead: async () => {
        estado = estado.map((n) => ({ ...n, leida: true }));
      },
    },
  };
}

describe("NotificationsPage", () => {
  it("las notificaciones sensibles muestran una vista previa discreta hasta que la persona decide verlas", async () => {
    const { user } = renderWithProviders(<NotificationsPage />, { repositories: conNotificaciones([SENSIBLE]) });
    expect(await screen.findByRole("heading", { name: "Aviso con vista previa discreta" })).toBeInTheDocument();
    expect(screen.queryByText("Detalle privado de prueba")).not.toBeInTheDocument();
    expect(screen.queryByText(/Contenido que no debe verse/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mostrar contenido" }));
    expect(screen.getByRole("heading", { name: "Detalle privado de prueba" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ocultar contenido" })).toHaveAttribute("aria-expanded", "true");
  });

  it("marca como leída una y luego todas; el filtro «Sin leer» queda vacío", async () => {
    const { user } = renderWithProviders(<NotificationsPage />, { repositories: crearRepositoriosDemo() });
    const lista = await screen.findByRole("list", { name: "Notificaciones" });
    expect(within(lista).getAllByText("Sin leer")).toHaveLength(2);

    await user.click(within(lista).getAllByRole("button", { name: /^Marcar como leída/ })[0]!);
    await waitFor(() => expect(within(lista).getAllByText("Sin leer")).toHaveLength(1));

    await user.click(screen.getByRole("button", { name: /Marcar todas/ }));
    await waitFor(() => expect(within(lista).queryAllByText("Sin leer")).toHaveLength(0));

    await user.click(screen.getByRole("radio", { name: /Sin leer/ }));
    expect(await screen.findByRole("heading", { name: "No tienes notificaciones sin leer" })).toBeInTheDocument();
  });
});
