import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDemoSession } from "@/app/session/store";
import { crearRepositoriosDemo } from "@/services/adapters/demo";
import { renderWithProviders } from "@/test/renderWithProviders";
import VerifyRepairPage from "./VerifyRepairPage";

function renderizar(reporteId: string, identidadId: string) {
  useDemoSession.setState({ identidadId });
  const repositories = crearRepositoriosDemo();
  const resultado = renderWithProviders(<VerifyRepairPage />, {
    ruta: `/participacion/verificar/${reporteId}`,
    patron: "/participacion/verificar/:reporteId",
    repositories,
  });
  return { ...resultado, repositories };
}

describe("Verificar reparación", () => {
  beforeEach(() => {
    Object.defineProperty(URL, "createObjectURL", { configurable: true, writable: true, value: vi.fn(() => "blob:vista-previa") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, writable: true, value: vi.fn() });
  });
  afterEach(() => {
    useDemoSession.setState({ identidadId: "ana" });
  });

  it("no permite verificar el propio reporte y lo explica con claridad", async () => {
    renderizar("rep-0002", "ana");
    expect(await screen.findByRole("heading", { name: "No puedes verificar tu propio reporte" })).toBeInTheDocument();
    expect(screen.getByText("No puedes verificar un reporte que tú hiciste.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enviar verificación" })).not.toBeInTheDocument();
  });

  it("no permite verificar dos veces el mismo reporte ni uno sin atención reportada", async () => {
    const { unmount } = renderizar("rep-0003", "ana");
    expect(await screen.findByRole("heading", { name: "Ya verificaste este reporte" })).toBeInTheDocument();
    unmount();
    renderizar("rep-0001", "ana");
    expect(await screen.findByRole("heading", { name: "Este reporte aún no se puede verificar" })).toBeInTheDocument();
  });

  it("muestra las tres opciones, valida la respuesta y enfoca el primer error", async () => {
    const { user } = renderizar("rep-0002", "bruno");
    expect(await screen.findByRole("radio", { name: /La reparación parece completada/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /El problema persiste/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /No puedo comprobarlo/ })).toBeInTheDocument();
    expect(screen.getByText(/Decir que el problema persiste vale lo mismo/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Enviar verificación" }));
    expect(await screen.findByText("Elige lo que observaste.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("radio", { name: /La reparación parece completada/ })).toHaveFocus());
  });

  it("envía la verificación: queda pendiente de revisión, sin doble envío ni cambio del estado municipal", async () => {
    const { user, repositories } = renderizar("rep-0002", "bruno");
    await user.click(await screen.findByLabelText(/El problema persiste/));
    await user.type(screen.getByRole("textbox", { name: /Comentario/ }), "Sigue sin encender de noche en la esquina.");
    await user.click(screen.getByRole("checkbox", { name: /Confirmo que observé el punto exacto/ }));
    expect(screen.getByText(/Calidad: 2 de 3 criterios/)).toBeInTheDocument();
    expect(screen.getByText(/sumarías 25 puntos/)).toBeInTheDocument();

    await user.dblClick(screen.getByRole("button", { name: "Enviar verificación" }));
    expect(await screen.findByRole("heading", { name: "Verificación enviada" })).toBeInTheDocument();
    expect(screen.getByText(/pendiente de revisión/, { selector: "strong" })).toBeInTheDocument();

    const actor = { id: "bruno", nombre: "Bruno Canul", iniciales: "BC", rol: "ciudadania", descripcion: "" } as const;
    const mias = (await repositories.verifications.listMine(actor)).filter((v) => v.reporteId === "rep-0002");
    expect(mias).toHaveLength(1);
    expect(mias[0]?.estadoRevision).toBe("pendiente_revision");
    expect(mias[0]?.resultado).toBe("problema_persiste");
    const reporte = await repositories.reports.get("rep-0002");
    expect(reporte?.estadoMunicipal).toBe("solucionado");
    const saldo = await repositories.rewards.getBalance(actor);
    expect(saldo.disponible).toBe(40);
    expect(saldo.pendientes).toBe(70 + 25);
  });
});
