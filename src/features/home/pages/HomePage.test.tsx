import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import HomePage from "./HomePage";

function renderInicio() {
  return renderWithProviders(<HomePage />, { ruta: "/", patron: "/", rutasExtra: [{ path: "*", element: <p>Destino interno</p> }] });
}

describe("HomePage", () => {
  it("saluda sólo con el nombre y tiene un único h1", () => {
    renderInicio();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Hola, Ana" })).toBeInTheDocument();
    expect(screen.getByText("¿Qué quieres hacer hoy?")).toBeInTheDocument();
  });

  it("el buscador principal lleva a /buscar?q=", async () => {
    const { user, router } = renderInicio();
    const buscador = screen.getByRole("search", { name: "Describe lo que necesitas" });
    expect(buscador).toHaveAttribute("data-guia", "inicio.buscador");
    await user.type(within(buscador).getByRole("searchbox"), "licencia de funcionamiento");
    await user.click(within(buscador).getByRole("button", { name: "Buscar" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/buscar"));
    expect(router.state.location.search).toBe("?q=licencia%20de%20funcionamiento");
  });

  it("accesos rápidos a módulos reales", () => {
    renderInicio();
    const accesos = screen.getByRole("region", { name: "Accesos rápidos" });
    const esperados: [RegExp, string][] = [
      [/Bache a la vista/, "/reportes/nuevo/bache"],
      [/Trámites y servicios/, "/servicios"],
      [/Mis gestiones/, "/gestiones"],
      [/Bienestar/, "/bienestar"],
      [/Visor Urbano/, "/mapa"],
      [/Mi expediente/, "/expediente"],
    ];
    for (const [nombre, ruta] of esperados) expect(within(accesos).getByRole("link", { name: nombre })).toHaveAttribute("href", ruta);
  });

  it("las seis bandas temáticas enlazan a módulos reales", () => {
    renderInicio();
    const temas = screen.getByRole("region", { name: "Explora por tema" });
    for (const titulo of ["Salud y Bienestar", "Seguridad y Protección", "Movilidad y Tránsito", "Medio ambiente y sostenibilidad", "Trámites y Atención", "Desarrollo Urbano y territorio"]) {
      expect(within(temas).getByRole("heading", { level: 3, name: titulo })).toBeInTheDocument();
    }
    expect(within(temas).getByRole("link", { name: /Línea Mujer/ })).toHaveAttribute("href", "/bienestar/linea-mujer");
    expect(within(temas).getByRole("button", { name: "Ayuda inmediata" })).toBeInTheDocument();
    expect(within(temas).getByRole("link", { name: /Ver servicios de medio ambiente/ })).toHaveAttribute("href", "/servicios/categoria/medio_ambiente");
    expect(within(temas).getByRole("link", { name: /Catastro y desarrollo urbano/ })).toHaveAttribute("href", "/servicios/categoria/territorio");
  });

  it("resume mis gestiones y mis reportes de demostración", async () => {
    renderInicio();
    const gestiones = screen.getByRole("region", { name: "Mis gestiones" });
    expect(await within(gestiones).findByText("Copia Simple de Cédula Catastral Vigente")).toBeInTheDocument();
    expect(within(gestiones).getByRole("link", { name: /Ver mis gestiones/ })).toHaveAttribute("href", "/gestiones");
    const reportes = screen.getByRole("region", { name: "Mis reportes" });
    expect(await within(reportes).findByRole("link", { name: /Ver mis \d* ?reportes/ })).toHaveAttribute("href", "/reportes/mis-reportes");
  });
});
