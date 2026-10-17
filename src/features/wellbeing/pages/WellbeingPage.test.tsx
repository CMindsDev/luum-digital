import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createRepositories } from "@/services/registry";
import type { Repositories } from "@/services/contracts";
import { renderWithProviders } from "@/test/renderWithProviders";
import WellbeingPage from "./WellbeingPage";

describe("Bienestar", () => {
  it("muestra la banda, los accesos y la ayuda inmediata con un solo h1", () => {
    renderWithProviders(<WellbeingPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Salud y Bienestar");
    expect(screen.getByRole("link", { name: /Salud mental/ })).toHaveAttribute("href", "/bienestar/salud-mental");
    expect(screen.getByRole("link", { name: /Línea Mujer/ })).toHaveAttribute("href", "/bienestar/linea-mujer");
    expect(screen.getByRole("button", { name: "Ayuda inmediata" })).toBeInTheDocument();
  });

  it("filtra los programas por área sin tocar la URL", async () => {
    const { user, router } = renderWithProviders(<WellbeingPage />, { ruta: "/bienestar" });
    await screen.findByRole("heading", { name: "Apoyo Psicológico (centros Alma Nova)" });
    const filtros = screen.getByRole("group", { name: "Filtrar programas por área" });
    await user.click(within(filtros).getByRole("button", { name: /^Mujeres/ }));
    expect(within(filtros).getByRole("button", { name: /^Mujeres/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("heading", { name: "Apoyo Psicológico (centros Alma Nova)" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Atención Especializada/ })).toBeInTheDocument();
    expect(router.state.location.search).toBe("");
  });

  it("si los programas fallan, muestra el error con reintento y la ayuda sigue disponible", async () => {
    const base = createRepositories("demo");
    const repositorios: Repositories = { ...base, wellbeing: { ...base.wellbeing, listPrograms: () => Promise.reject(new Error("falla")) } };
    renderWithProviders(<WellbeingPage />, { repositories: repositorios });
    expect(await screen.findByText("No se pudieron cargar los programas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Llamar al 911/ })).toHaveAttribute("href", "tel:911");
  });
});
