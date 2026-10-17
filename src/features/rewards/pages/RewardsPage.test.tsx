import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useDemoSession } from "@/app/session/store";
import { crearRepositoriosDemo } from "@/services/adapters/demo";
import { renderWithProviders } from "@/test/renderWithProviders";
import RewardsPage from "./RewardsPage";

const ANA = { id: "ana", nombre: "Ana Ek", iniciales: "AE", rol: "ciudadania", descripcion: "" } as const;

function renderizar(identidadId = "ana") {
  useDemoSession.setState({ identidadId });
  const repositories = crearRepositoriosDemo();
  const resultado = renderWithProviders(<RewardsPage />, { ruta: "/participacion/recompensas", patron: "/participacion/recompensas", repositories });
  return { ...resultado, repositories };
}

describe("Recompensas", () => {
  afterEach(() => {
    useDemoSession.setState({ identidadId: "ana" });
  });

  it("separa puntos disponibles y pendientes y marca los beneficios como ejemplo", async () => {
    renderizar();
    expect(await screen.findByRole("heading", { level: 1, name: "Recompensas" })).toBeInTheDocument();
    await waitFor(() => expect(document.querySelector('[data-saldo="disponible"]')).toHaveTextContent("105"));
    expect(document.querySelector('[data-saldo="pendientes"]')).toHaveTextContent("40");
    const lista = await screen.findByRole("list", { name: "Beneficios de ejemplo" });
    expect(within(lista).getAllByText("Ejemplo")).toHaveLength(5);
    expect(screen.getByText(/no hay comercios, patrocinios ni descuentos municipales, fiscales o comerciales/)).toBeInTheDocument();
  });

  it("bloquea los beneficios que el saldo aprobado no cubre y el agotado", async () => {
    renderizar();
    const lista = await screen.findByRole("list", { name: "Beneficios de ejemplo" });
    await waitFor(() => expect(within(lista).getByText("Te faltan 45 puntos aprobados.")).toBeInTheDocument());
    const botones = within(lista).getAllByRole("button");
    expect(botones.filter((boton) => !(boton as HTMLButtonElement).disabled)).toHaveLength(1);
    expect(within(lista).getByText("Agotado: es un ejemplo para mostrar este estado.")).toBeInTheDocument();
  });

  it("canjea con confirmación explícita, genera DEMO-B y nunca deja saldo negativo", async () => {
    const { user, repositories } = renderizar();
    const lista = await screen.findByRole("list", { name: "Beneficios de ejemplo" });
    const canjear = await within(lista).findByRole("button", { name: /Canjear\s*Insignia/ });
    await waitFor(() => expect(canjear).toBeEnabled());
    await user.click(canjear);

    const confirmacion = await screen.findByRole("dialog", { name: "¿Canjear este beneficio de ejemplo?" });
    expect(within(confirmacion).getByText(/código DEMO-B sin validez/)).toBeInTheDocument();
    await user.dblClick(within(confirmacion).getByRole("button", { name: "Confirmar canje simulado" }));

    const resultado = await screen.findByRole("dialog", { name: "Canje simulado registrado" });
    expect(within(resultado).getByText(/^DEMO-B-\d{7}$/)).toBeInTheDocument();
    await user.click(within(resultado).getByRole("button", { name: "Entendido" }));

    const canjes = await repositories.rewards.listRedemptions(ANA);
    expect(canjes).toHaveLength(1);
    const saldo = await repositories.rewards.getBalance(ANA);
    expect(saldo).toMatchObject({ disponible: 5, pendientes: 40, totalCanjeado: 100 });
    await waitFor(() => expect(document.querySelector('[data-saldo="disponible"]')).toHaveTextContent("5"));
    expect(await within(await screen.findByRole("list", { name: "Beneficios de ejemplo" })).findByText("Te faltan 95 puntos aprobados.")).toBeInTheDocument();
  });

  it("muestra el estado vacío del historial de una identidad sin movimientos", async () => {
    renderizar("operador");
    expect(await screen.findByRole("heading", { name: "Aún no tienes movimientos" })).toBeInTheDocument();
    await waitFor(() => expect(document.querySelector('[data-saldo="disponible"]')).toHaveTextContent("0"));
  });
});
