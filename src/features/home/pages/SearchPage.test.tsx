import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import SearchPage from "./SearchPage";

function renderBusqueda(ruta: string) {
  return renderWithProviders(<SearchPage />, {
    ruta,
    patron: "/buscar",
    rutasExtra: [{ path: "*", element: <p>Destino interno</p> }],
  });
}

const RESPUESTA_VACIA = { respuesta: null, generada: false, citas: [], pasajes: [], intencion: { categoria: null, modo: "shadow" } } as const;

describe("SearchPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(RESPUESTA_VACIA), { status: 200, headers: { "Content-Type": "application/json" } })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sin consulta muestra sugerencias con las consultas del brief", () => {
    renderBusqueda("/buscar");
    expect(screen.getByRole("heading", { level: 1, name: "Buscar" })).toBeInTheDocument();
    expect(screen.getByText(/Buscamos en trámites, dependencias y la plataforma/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Quiero reportar un bache" })).toHaveAttribute("href", "/buscar?q=Quiero%20reportar%20un%20bache");
    // La consulta de salud mental no lleva el texto en la URL.
    expect(screen.getByRole("link", { name: "Busco apoyo psicológico" })).toHaveAttribute("href", "/buscar");
  });

  it("muestra la intención con acciones internas y las fichas del catálogo", async () => {
    const { user, router } = renderBusqueda("/buscar?q=Quiero%20reportar%20un%20bache");
    const panel = await screen.findByRole("region", { name: "Reportar un problema en la calle" });
    const accion = within(panel).getByRole("link", { name: /Reportar: Bache/ });
    expect(accion).toHaveAttribute("href", "/reportes/nuevo/bache");
    expect(await screen.findByRole("heading", { name: "Fichas del catálogo" })).toBeInTheDocument();
    await user.click(accion);
    await waitFor(() => expect(router.state.location.pathname).toBe("/reportes/nuevo/bache"));
  });

  it("consultar mi folio ofrece el campo de folio y valida el formato", async () => {
    const { user, router } = renderBusqueda("/buscar?q=Quiero%20consultar%20mi%20folio");
    const campo = await screen.findByRole("textbox", { name: "Tu folio de demostración" });
    await user.click(screen.getByRole("button", { name: "Consultar folio" }));
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo).toHaveFocus();
    await user.type(campo, "demo-r-1");
    await user.click(screen.getByRole("button", { name: "Consultar folio" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/reportes/mis-reportes"));
    expect(router.state.location.search).toBe("?folio=DEMO-R-0000001");
  });

  it("apoyo psicológico: ayuda inmediata visible y la consulta sale de la URL", async () => {
    const { router } = renderBusqueda("/buscar?q=Busco%20apoyo%20psicol%C3%B3gico");
    expect(await screen.findByRole("region", { name: "Apoyo psicológico" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ayuda inmediata" })).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.search).toBe(""));
    expect(screen.getByRole("searchbox", { name: "¿Qué necesitas?" })).toHaveValue("Busco apoyo psicológico");
  });

  it("consulta demasiado corta pide escribir más", () => {
    renderBusqueda("/buscar?q=a");
    expect(screen.getByRole("heading", { name: "Escribe un poco más" })).toBeInTheDocument();
  });
});
