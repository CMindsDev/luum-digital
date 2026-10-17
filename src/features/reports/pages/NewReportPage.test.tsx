import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { crearRepositoriosDemo } from "@/services/adapters/demo";
import NewReportPage from "./NewReportPage";

const DESTINOS = [
  { path: "/reportes/mis-reportes", element: <h1>Destino: Mis reportes</h1> },
  { path: "/reportes/:reporteId", element: <h1>Destino: detalle</h1> },
];

function renderizar(ruta = "/reportes/nuevo/bache") {
  const repositories = crearRepositoriosDemo();
  const resultado = renderWithProviders(<NewReportPage />, { ruta, patron: "/reportes/nuevo/:categoria", rutasExtra: DESTINOS, repositories });
  return { ...resultado, repositories };
}

describe("Nuevo reporte (Bache a la vista)", () => {
  beforeEach(() => {
    Object.defineProperty(URL, "createObjectURL", { configurable: true, writable: true, value: vi.fn(() => "blob:vista-previa") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, writable: true, value: vi.fn() });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("valida la descripción y enfoca el primer error", async () => {
    const { user } = renderizar();
    expect(await screen.findByRole("heading", { level: 1, name: "Bache a la vista" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    const descripcion = await screen.findByRole("textbox", { name: /Describe el problema/ });
    await waitFor(() => expect(descripcion).toHaveFocus());
    expect(descripcion).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Describe el problema con al menos 15 caracteres.", { selector: "p" })).toBeInTheDocument();
  });

  it("recorrido completo con ubicación manual: folio DEMO-R, puntos pendientes y sin doble envío", async () => {
    const { user, repositories, router } = renderizar();
    await user.type(await screen.findByRole("textbox", { name: /Describe el problema/ }), "Bache grande en el carril derecho, frente a la tienda.");
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(await screen.findByRole("heading", { level: 2, name: "Confirma la ubicación" })).toHaveFocus();
    await user.selectOptions(screen.getByRole("combobox", { name: /Colonia o comisaría/ }), "komchen");
    await user.type(screen.getByRole("textbox", { name: /^Calle/ }), "21");
    await user.type(screen.getByRole("textbox", { name: /Cruzamiento 1/ }), "20");
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(await screen.findByRole("heading", { level: 2, name: "Agrega una fotografía (opcional)" })).toBeInTheDocument();
    expect(screen.getByText(/No te expongas al tránsito/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(await screen.findByText("No encontramos reportes iguales abiertos cerca.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(await screen.findByRole("heading", { level: 2, name: "Revisa tu reporte" })).toBeInTheDocument();
    expect(screen.getByText("Calle 21 x 20, Komchén")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Asistencia simulada" })).toBeInTheDocument();

    const enviar = screen.getByRole("button", { name: "Enviar a la simulación" });
    const antes = (await repositories.reports.list()).length;
    await user.dblClick(enviar);

    const dialogo = await screen.findByRole("dialog", { name: "Tu folio de reporte es:" });
    const folio = within(dialogo).getByText(/^DEMO-R-\d{7}$/);
    expect(within(dialogo).getByText("Dale seguimiento en «Mis reportes».")).toBeInTheDocument();
    expect(within(dialogo).getByText(/quedan pendientes/)).toBeInTheDocument();
    const despues = await repositories.reports.list();
    expect(despues).toHaveLength(antes + 1);
    expect(despues[0]?.folio).toBe(folio.textContent);
    expect(despues[0]?.asistencia?.origen).toBe("reglas_demo");

    await user.click(within(dialogo).getByRole("button", { name: "Aceptar" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/reportes/mis-reportes"));
  });

  it("posible duplicado: aportar información no crea reporte ni puntos", async () => {
    const { user, repositories } = renderizar();
    const actor = { id: "ana", nombre: "Ana Ek", iniciales: "AE", rol: "ciudadania", descripcion: "" } as const;
    await user.type(await screen.findByRole("textbox", { name: /Describe el problema/ }), "Sigue el bache en el carril derecho frente al parque.");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await screen.findByRole("heading", { level: 2, name: "Confirma la ubicación" });
    await user.selectOptions(screen.getByRole("combobox", { name: /Colonia o comisaría/ }), "centro");
    await user.type(screen.getByRole("textbox", { name: /^Calle/ }), "60");
    await user.type(screen.getByRole("textbox", { name: /Cruzamiento 1/ }), "59");
    await user.type(screen.getByRole("textbox", { name: /Cruzamiento 2/ }), "61");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await screen.findByRole("heading", { level: 2, name: "Agrega una fotografía (opcional)" });
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    const reportesAntes = (await repositories.reports.list()).length;
    const movimientosAntes = (await repositories.rewards.listMovements(actor)).length;
    await user.click(await screen.findByRole("button", { name: /Es el mismo incidente: aportar información al reporte DEMO-R-0000001/ }));
    expect(await screen.findByRole("heading", { name: "Aportar información al reporte DEMO-R-0000001" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Enviar aportación" }));

    expect(await screen.findByRole("heading", { name: "Aportaste información al reporte DEMO-R-0000001" })).toBeInTheDocument();
    expect(await repositories.reports.list()).toHaveLength(reportesAntes);
    expect(await repositories.rewards.listMovements(actor)).toHaveLength(movimientosAntes);
    const bache = await repositories.reports.get("rep-0001");
    expect(bache?.aportaciones).toHaveLength(1);
    expect(bache?.aportaciones[0]?.descripcion).toBe("Sigue el bache en el carril derecho frente al parque.");
  });

  it("rechaza fotos de otro tipo y muestra la vista previa temporal de una válida", async () => {
    const { user } = renderizar();
    await user.type(await screen.findByRole("textbox", { name: /Describe el problema/ }), "Bache grande en el carril derecho, frente a la tienda.");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await screen.findByRole("heading", { level: 2, name: "Confirma la ubicación" });
    await user.selectOptions(screen.getByRole("combobox", { name: /Colonia o comisaría/ }), "komchen");
    await user.type(screen.getByRole("textbox", { name: /^Calle/ }), "21");
    await user.type(screen.getByRole("textbox", { name: /Cruzamiento 1/ }), "20");
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    const entrada = await screen.findByLabelText("Elegir foto");
    // Un archivo que se cuela pese a «accept» (p. ej. arrastrado): se valida igual.
    fireEvent.change(entrada, { target: { files: [new File(["%PDF"], "documento.pdf", { type: "application/pdf" })] } });
    expect(await screen.findByRole("alert")).toHaveTextContent("La foto debe ser JPG, PNG o WebP.");

    fireEvent.change(entrada, { target: { files: [new File(["foto"], "bache.jpg", { type: "image/jpeg" })] } });
    expect(await screen.findByRole("img", { name: "Vista previa de la foto que elegiste" })).toHaveAttribute("src", "blob:vista-previa");
    await user.click(screen.getByRole("button", { name: "Quitar foto" }));
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:vista-previa"));
  });

  it("geolocalización rechazada: lo explica y deja seguir con la dirección escrita", async () => {
    const getCurrentPosition = vi.fn((_ok: PositionCallback, error?: PositionErrorCallback | null) =>
      error?.({ code: 1, message: "", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }),
    );
    vi.stubGlobal("navigator", { ...navigator, geolocation: { getCurrentPosition } });
    const { user } = renderizar();
    await user.type(await screen.findByRole("textbox", { name: /Describe el problema/ }), "Bache grande en el carril derecho, frente a la tienda.");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await screen.findByRole("heading", { level: 2, name: "Confirma la ubicación" });
    expect(getCurrentPosition).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Usar mi ubicación" }));
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/No diste permiso para usar tu ubicación/)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Escribir la dirección/ })).toBeChecked();
    expect(screen.getByRole("textbox", { name: /^Calle/ })).toBeEnabled();
  });

  it("prefill del asistente: lo avisa, llena los campos y no envía nada", async () => {
    const repositories = crearRepositoriosDemo();
    const { router } = renderWithProviders(<NewReportPage />, { ruta: "/reportes", patron: "/reportes/nuevo/:categoria", rutasExtra: [{ path: "/reportes", element: <p>Hub</p> }], repositories });
    const antes = (await repositories.reports.list()).length;
    await router.navigate("/reportes/nuevo/bache", {
      state: { prefill: { tipo: "reporte", categoria: "bache", origen: "asistente", descripcion: "Bache profundo en la esquina de la 60", referenciaUbicacion: "calle 60 del Centro" } },
    });
    expect(await screen.findByText("Preparado por el asistente: revisa y confirma")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /Describe el problema/ })).toHaveValue("Bache profundo en la esquina de la 60");
    expect(await repositories.reports.list()).toHaveLength(antes);
  });

  it("un tipo desconocido muestra un estado útil", async () => {
    renderizar("/reportes/nuevo/ovni");
    expect(await screen.findByRole("heading", { level: 1, name: "Tipo de reporte no encontrado" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver tipos de reporte" })).toHaveAttribute("href", "/reportes");
  });
});
