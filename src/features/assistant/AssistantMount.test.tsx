import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { createMemoryRouter, Outlet, RouterProvider, useLocation } from "react-router";
import { AppProviders } from "@/app/providers";
import { storeAsistenteGeneral } from "./runtime/store";
import { crearQueryClientDePrueba } from "@/test/renderWithProviders";
import { AssistantMount } from "./AssistantMount";
import { usePekitoUI } from "./ui/estado-pekito";

function Capa() {
  return (
    <>
      <AssistantMount />
      <Outlet />
    </>
  );
}

/** Pantalla de relleno: muestra la ruta y el estado de navegación (lo que el asistente preparó). */
function Pagina() {
  const { pathname, state } = useLocation();
  return (
    <main>
      <h1>Pantalla de prueba</h1>
      <p data-testid="ruta">{pathname}</p>
      <p data-testid="estado">{JSON.stringify(state)}</p>
    </main>
  );
}

function montar(ruta: string) {
  const router = createMemoryRouter([{ path: "/", element: <Capa />, children: [{ path: "*", element: <Pagina /> }] }], { initialEntries: [ruta] });
  const resultado = render(
    <AppProviders queryClient={crearQueryClientDePrueba()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { router, user: userEvent.setup(), ...resultado };
}

const ABRIR = { name: /Abrir Pekito/ };

afterEach(() => {
  storeAsistenteGeneral.getState().resetear();
  usePekitoUI.setState({ abierto: false, panelMontado: false, bienvenidaAbierta: false, vista: "lanzador", borrador: "", enfoquePendiente: false, mensajeVisto: null, avisoVisto: null });
});

describe("AssistantMount", () => {
  it("publica --espacio-asistente mientras se ve y lo libera en salud mental y Línea Mujer (sin botón de Pekito)", async () => {
    const { router } = montar("/");
    expect(await screen.findByRole("button", ABRIR)).toBeInTheDocument();
    expect(document.documentElement.style.getPropertyValue("--espacio-asistente")).toBe("5rem");

    for (const ruta of ["/bienestar/salud-mental", "/bienestar/linea-mujer/solicitud"]) {
      await router.navigate(ruta);
      await waitFor(() => expect(screen.queryByRole("button", ABRIR)).not.toBeInTheDocument());
      expect(document.documentElement.style.getPropertyValue("--espacio-asistente")).toBe("");
    }

    await router.navigate("/bienestar");
    expect(await screen.findByRole("button", ABRIR)).toBeInTheDocument();
  });

  it("al entrar a salud mental con el panel abierto lo cierra y corta la sesión (sin mezclar ámbitos)", async () => {
    const { router, user } = montar("/");
    await user.click(await screen.findByRole("button", ABRIR));
    await user.click(await screen.findByRole("button", { name: "Saltar" }));
    expect(await screen.findByRole("dialog", { name: /PEKITO/i })).toBeInTheDocument();

    await router.navigate("/bienestar/salud-mental");
    await waitFor(() => expect(usePekitoUI.getState().abierto).toBe(false));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("primera vez: bienvenida; luego «Por texto o por voz» explica la voz con lenguaje humano", async () => {
    const { user } = montar("/");
    await user.click(await screen.findByRole("button", ABRIR));
    // Bienvenida (Figma 22:67): sigue siendo la primera pantalla.
    expect(await screen.findByText("Un agente que sí te atiende")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Saltar" }));

    const panel = await screen.findByRole("dialog", { name: /PEKITO/i });
    // Salta a la conversación escrita (modo «escribir» por omisión): vuelve al lanzador.
    await user.click(within(panel).getByRole("button", { name: /Volver a «Por texto o por voz»/ }));
    expect(within(panel).getByRole("heading", { name: /Por texto o por voz/ })).toBeInTheDocument();
    const hablar = within(panel).getByRole("button", { name: /Hablar/ });
    expect(hablar).toHaveAttribute("aria-disabled", "true");
    expect(within(panel).getByText("La voz no está disponible ahora. Puedes escribirme.")).toBeInTheDocument();
    expect(within(panel).getByText(/Pekito te ayuda a orientarte en la app/i)).toBeInTheDocument();
    expect(within(panel).getByText(/Prototipo de demostración en Laboratorio de Innovación Digital\. No realiza gestiones oficiales/i)).toBeInTheDocument();
  });

  it("«Quiero reportar un bache…» abre el formulario preparado, no envía nada y deja la tarjeta «Revisar y confirmar»", async () => {
    const { router, user } = montar("/");
    await user.click(await screen.findByRole("button", ABRIR));
    await user.click(await screen.findByRole("button", { name: "Saltar" }));
    const panel = await screen.findByRole("dialog", { name: /PEKITO/i });

    await user.type(within(panel).getByRole("textbox", { name: "Escribe a Pekito" }), "Quiero reportar un bache en la calle 60 del Centro{Enter}");

    await waitFor(() => expect(router.state.location.pathname).toBe("/reportes/nuevo/bache"), { timeout: 4000 });
    const estado = JSON.parse(screen.getByTestId("estado").textContent ?? "null") as { prefill: Record<string, unknown> };
    expect(estado.prefill).toMatchObject({
      tipo: "reporte",
      categoria: "bache",
      origen: "asistente",
      descripcion: "Un bache en la calle 60 del Centro.",
      referenciaUbicacion: "calle 60 del Centro",
    });
    // Nunca se crea un folio ni se envía: el recibo es «preparada_para_confirmar».
    const recibos = storeAsistenteGeneral.getState().recibos;
    expect(recibos.map((recibo) => recibo.estado)).toEqual(["preparada_para_confirmar"]);
    expect(JSON.stringify(recibos)).not.toMatch(/DEMO-R-/);
    // El panel cede la pantalla (pantalla completa en teléfono) y la píldora cuenta qué pasó.
    await waitFor(() => expect(usePekitoUI.getState().abierto).toBe(false));
    expect(await screen.findByText(/^Listo: abrí «Bache a la vista»/)).toBeInTheDocument();

    // Al reabrir: la persona, el recibo y la respuesta, con «Revisar y confirmar».
    await user.click(screen.getByRole("button", ABRIR));
    const reabierto = await screen.findByRole("dialog", { name: /PEKITO/i });
    expect(within(reabierto).getByRole("button", { name: "Revisar y confirmar" })).toBeInTheDocument();
    expect(within(reabierto).getByText(/Nada se envía hasta que tú lo confirmes/)).toBeInTheDocument();
  });

  it("las sugerencias prellenan el compositor y no envían solas", async () => {
    const { user } = montar("/");
    await user.click(await screen.findByRole("button", ABRIR));
    await user.click(await screen.findByRole("button", { name: "Saltar" }));
    const panel = await screen.findByRole("dialog", { name: /PEKITO/i });
    await user.click(within(panel).getByRole("button", { name: "Consultar mi folio" }));
    expect(within(panel).getByRole("textbox", { name: "Escribe a Pekito" })).toHaveValue("Quiero consultar mi folio");
    expect(storeAsistenteGeneral.getState().mensajes).toEqual([]);
  });

  it("Escape cierra el panel y devuelve el foco a la mascota", async () => {
    const { user } = montar("/");
    const mascota = await screen.findByRole("button", ABRIR);
    await user.click(mascota);
    await user.click(await screen.findByRole("button", { name: "Saltar" }));
    await screen.findByRole("dialog", { name: /PEKITO/i });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(usePekitoUI.getState().abierto).toBe(false));
    await waitFor(() => expect(screen.getByRole("button", ABRIR)).toHaveFocus());
  });
});
