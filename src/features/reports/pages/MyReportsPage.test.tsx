import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { crearRepositoriosDemo } from "@/services/adapters/demo";
import { renderWithProviders } from "@/test/renderWithProviders";
import MyReportsPage from "./MyReportsPage";
import ReportDetailPage from "./ReportDetailPage";

describe("Mis reportes", () => {
  it("agrupa los reportes de la identidad activa por estatus con contador", async () => {
    const repositories = crearRepositoriosDemo();
    const propios = await repositories.reports.list({ identidadId: "ana" });
    renderWithProviders(<MyReportsPage />, { ruta: "/reportes/mis-reportes", patron: "/reportes/mis-reportes", repositories });
    expect(await screen.findByRole("heading", { level: 1, name: "Mis reportes" })).toBeInTheDocument();
    expect(await screen.findByText(`${propios.length} reportes.`)).toBeInTheDocument();
    for (const etiqueta of ["Registrado", "En proceso de atención", "Solucionado", "Motivo de cancelación"]) {
      expect(screen.getByRole("button", { name: new RegExp(`^${etiqueta}\\s*\\d+\\s*reportes?$`) })).toBeInTheDocument();
    }
    const registrado = screen.getByRole("button", { name: /^Registrado/ });
    expect(registrado).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("article").length).toBe(propios.length);
  });

  it("busca por folio, y si no es tuyo lo encuentra entre los reportes de demostración", async () => {
    const repositories = crearRepositoriosDemo();
    const { user, router } = renderWithProviders(<MyReportsPage />, { ruta: "/reportes/mis-reportes", patron: "/reportes/mis-reportes", repositories });
    await user.type(await screen.findByRole("textbox", { name: "Buscar por folio" }), "DEMO-R-0000001");
    await user.click(screen.getByRole("button", { name: "Buscar" }));
    await waitFor(() => expect(router.state.location.search).toBe("?folio=DEMO-R-0000001"));
    expect(await screen.findByRole("heading", { name: "Este folio no está entre tus reportes" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Bache, folio DEMO-R-0000001/ })).toHaveAttribute("href", "/reportes/rep-0001");
  });

  it("valida que la fecha fin no sea anterior a la de inicio", async () => {
    const { user } = renderWithProviders(<MyReportsPage />, { ruta: "/reportes/mis-reportes", patron: "/reportes/mis-reportes" });
    await user.type(await screen.findByLabelText("Fecha inicio"), "2026-10-10");
    await user.type(screen.getByLabelText("Fecha fin"), "2026-10-01");
    await user.click(screen.getByRole("button", { name: "Filtrar resultados" }));
    expect(await screen.findByText("La fecha fin debe ser igual o posterior a la fecha inicio.")).toBeInTheDocument();
    expect(screen.getByLabelText("Fecha fin")).toHaveFocus();
  });
});

describe("Detalle del reporte", () => {
  it("separa estado municipal y verificación ciudadana y enlaza al mapa y a verificar", async () => {
    renderWithProviders(<ReportDetailPage />, { ruta: "/reportes/rep-0002", patron: "/reportes/:reporteId" });
    expect(await screen.findByRole("heading", { level: 1, name: "Luminaria" })).toBeInTheDocument();
    const estatus = screen.getByRole("region", { name: "Estatus" });
    expect(within(estatus).getByText("Estado municipal")).toBeInTheDocument();
    expect(within(estatus).getByText("Solucionado")).toBeInTheDocument();
    expect(within(estatus).getByText("Verificación pendiente")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver en el mapa" })).toHaveAttribute("href", "/mapa?reporte=rep-0002");
    // rep-0002 es de Ana (identidad activa): no puede verificarse a sí misma.
    expect(await screen.findByText("No puedes verificar un reporte que tú hiciste.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Verificar la reparación" })).not.toBeInTheDocument();
  });

  it("un reporte inexistente muestra un estado útil", async () => {
    renderWithProviders(<ReportDetailPage />, { ruta: "/reportes/rep-9999", patron: "/reportes/:reporteId" });
    expect(await screen.findByRole("heading", { level: 1, name: "Reporte no encontrado" })).toBeInTheDocument();
  });
});
