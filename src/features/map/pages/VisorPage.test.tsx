import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useDemoSession } from "@/app/session/store";
import { useDemoControls } from "@/services/demo-controls";
import { renderWithProviders } from "@/test/renderWithProviders";
import VisorPage from "./VisorPage";

function renderVisor(ruta: string) {
  useDemoControls.getState().establecer({ latenciaMs: 0 });
  return renderWithProviders(<VisorPage />, { ruta, patron: "/mapa" });
}

afterEach(() => {
  useDemoSession.getState().cambiarIdentidad("ana");
});

describe("Visor Urbano (vista Lista)", () => {
  it("muestra las incidencias filtradas desde la URL y quita un filtro sin perder la vista", async () => {
    const { user, router } = renderVisor("/mapa?vista=lista&categoria=bache&estado=registrado");
    expect(screen.getByRole("heading", { level: 1, name: "Mapa / Visor Urbano" })).toBeInTheDocument();
    const lista = await screen.findByRole("list", { name: "Incidencias" });
    const tarjetas = within(lista).getAllByRole("article");
    expect(tarjetas.length).toBeGreaterThan(0);
    for (const tarjeta of tarjetas) {
      expect(within(tarjeta).getByRole("heading")).toHaveTextContent("Bache");
      expect(within(tarjeta).getByText("Registrado")).toBeInTheDocument();
    }
    expect(screen.getByText(/de 60 incidencias de demostración con estos filtros/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Quitar el filtro Registrado" }));
    await waitFor(() => expect(router.state.location.search).toBe("?vista=lista&categoria=bache"));
    expect(screen.getByRole("radio", { name: "Lista" })).toHaveAttribute("aria-checked", "true");
  });

  it("ciudadanía no ve la capa de bienestar agregada; operación sí, con su leyenda", async () => {
    const primera = renderVisor("/mapa?vista=lista");
    const leyenda = await screen.findByRole("region", { name: "Capas y leyenda" });
    expect(within(leyenda).getByText("Demanda reportada (datos de demostración). La prioridad del servicio no se decide por popularidad.")).toBeInTheDocument();
    expect(within(leyenda).queryByRole("heading", { name: "Demanda de bienestar agregada" })).not.toBeInTheDocument();
    primera.unmount();

    useDemoSession.getState().cambiarIdentidad("operador");
    renderVisor("/mapa?vista=lista");
    const leyendaOperacion = await screen.findByRole("region", { name: "Capas y leyenda" });
    expect(within(leyendaOperacion).getByRole("heading", { name: "Demanda de bienestar agregada" })).toBeInTheDocument();
    expect(await within(leyendaOperacion).findByText(/zonas? visibles? con al menos 10 registros/)).toBeInTheDocument();
    expect(within(leyendaOperacion).getAllByText("Datos ficticios agregados; no provienen de conversaciones.").length).toBeGreaterThan(0);
  });

  it("explica que no hay capas territoriales oficiales y lista las sedes verificadas sin coordenadas", async () => {
    renderVisor("/mapa?vista=lista");
    const leyenda = await screen.findByRole("region", { name: "Capas y leyenda" });
    expect(within(leyenda).getByText(/Sin acceso autorizado a las capas del Visor Urbano/)).toBeInTheDocument();
    const ubicaciones = await screen.findByRole("region", { name: "Ubicaciones de atención verificadas" });
    expect(await within(ubicaciones).findByText(/0 con coordenadas publicadas/)).toBeInTheDocument();
    expect(within(ubicaciones).getByRole("heading", { name: /Atención psicológica/ })).toBeInTheDocument();
  });
});
