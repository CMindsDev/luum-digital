import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { crearRepositoriosDemo } from "@/services/adapters/demo";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { IdentidadDemo } from "@/types";
import { fechaMinimaCita } from "../flows/escenario/valores";
import StartServicePage from "./StartServicePage";

const ANA: IdentidadDemo = { id: "ana", nombre: "Ana Ek", iniciales: "AE", rol: "ciudadania", descripcion: "Ciudadana ficticia" };

function renderRecorrido(servicioId: string) {
  const repositories = crearRepositoriosDemo();
  const resultado = renderWithProviders(<StartServicePage />, {
    ruta: `/servicios/${servicioId}/iniciar`,
    patron: "/servicios/:servicioId/iniciar",
    repositories,
    rutasExtra: [{ path: "/gestiones/:gestionId", element: <p>Detalle de la gestión</p> }],
  });
  return { ...resultado, repositories };
}

describe("FormFlow (solicitud simulada)", () => {
  it("reutiliza datos del expediente sólo campo por campo y con confirmación, revisa y asigna folio DEMO-G", async () => {
    const { user, router, repositories } = renderRecorrido("mid-pac-404");
    expect(await screen.findByRole("heading", { level: 1, name: "Atención Ciudadana por medios digitales" })).toBeInTheDocument();

    // Nada se copia sin confirmar: el botón de confirmar empieza deshabilitado.
    await user.click(await screen.findByRole("button", { name: "Usar datos de mi expediente" }));
    const dialogo = await screen.findByRole("dialog", { name: "Usar datos de mi expediente" });
    const confirmar = within(dialogo).getByRole("button", { name: "Elige al menos un dato" });
    expect(confirmar).toBeDisabled();
    const casillaNombre = await within(dialogo).findByRole("checkbox", { name: "Nombre completo" });
    expect(casillaNombre).not.toBeChecked();
    expect(within(dialogo).getByText("Ana Ek Canché")).toBeInTheDocument();
    await user.click(casillaNombre);
    await user.click(within(dialogo).getByRole("button", { name: "Copiar 1 dato" }));

    expect(screen.getByRole("textbox", { name: /Nombre completo/ })).toHaveValue("Ana Ek Canché");
    expect(screen.getByRole("textbox", { name: /Correo electrónico/ })).toHaveValue("");

    // Validación con foco al primer error.
    await user.click(screen.getByRole("button", { name: "Revisar solicitud" }));
    const correo = screen.getByRole("textbox", { name: /Correo electrónico/ });
    await waitFor(() => expect(correo).toHaveFocus());
    expect(correo).toHaveAttribute("aria-invalid", "true");

    await user.type(correo, "ana.prueba@ejemplo.mx");
    await user.type(screen.getByRole("textbox", { name: /Teléfono/ }), "999 000 0000");
    await user.type(screen.getByRole("textbox", { name: /¿Qué necesitas\?/ }), "Quiero saber los horarios de atención en línea.");
    await user.click(screen.getByRole("checkbox", { name: /Entiendo que es una simulación/ }));
    await user.click(screen.getByRole("button", { name: "Revisar solicitud" }));

    expect(await screen.findByRole("heading", { name: "Revisa antes de enviar" })).toBeInTheDocument();
    expect(screen.getByText("De tu expediente")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Enviar solicitud simulada" }));

    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/gestiones\//));
    const gestiones = await repositories.procedures.list(ANA);
    const enviada = gestiones.find((g) => g.servicioId === "mid-pac-404");
    expect(enviada?.folio).toMatch(/^DEMO-G-\d{7}$/);
    expect(enviada?.estado).toBe("enviada");
    expect(enviada?.camposReutilizados).toEqual(["nombreCompleto"]);
    expect(enviada?.datos.telefono).toBe("9990000000");
  });
});

describe("PaymentFlow (pago simulado)", () => {
  it("no pide datos de tarjeta, muestra datos de prueba y termina en «Pago simulado» con referencia DEMO-P", async () => {
    const { user } = renderRecorrido("mid-ftm-188");
    expect(await screen.findByRole("heading", { level: 1 })).toBeInTheDocument();
    await screen.findByRole("button", { name: "Continuar al pago simulado" });
    // Ningún campo pide número de tarjeta, vencimiento o CVV.
    expect(screen.queryByRole("textbox", { name: /tarjeta|cvv|vencimiento/i })).not.toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: /Nombre completo/ }), "Ana Ek Canché");
    await user.type(screen.getByRole("textbox", { name: /Correo electrónico/ }), "ana@ejemplo.mx");
    await user.selectOptions(screen.getByRole("combobox", { name: /Método de pago simulado/ }), "tarjeta_demo");
    await user.click(screen.getByRole("checkbox", { name: /Entiendo que es una simulación/ }));
    await user.click(screen.getByRole("button", { name: "Continuar al pago simulado" }));

    expect(await screen.findByText(/Datos de prueba/)).toBeInTheDocument();
    expect(screen.getByText("Monto ficticio de demostración")).toBeInTheDocument();
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Simular pago" }));

    expect(await screen.findByText("Pago simulado aprobado")).toBeInTheDocument();
    expect(screen.getByText(/^DEMO-P-\d{7}$/)).toBeInTheDocument();
    expect(screen.getByText(/^DEMO-G-\d{7}$/)).toBeInTheDocument();
    expect(screen.getByText(/no es un recibo ni un comprobante fiscal/)).toBeInTheDocument();
    expect(screen.queryByText(/recibo oficial|factura|CFDI/i)).not.toBeInTheDocument();
  });
});

describe("AppointmentFlow (cita simulada)", () => {
  it("usa las sedes publicadas en la ficha, nunca confirma la cita y guarda la referencia DEMO-C", async () => {
    const { user, router, repositories } = renderRecorrido("mid-bih-400");
    await screen.findByRole("button", { name: "Revisar solicitud" });
    expect(screen.getByRole("option", { name: "Subdirección de Salud" })).toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: /Nombre completo/ }), "Ana Ek Canché");
    await user.type(screen.getByRole("textbox", { name: /Teléfono/ }), "9990000000");
    await user.selectOptions(screen.getByRole("combobox", { name: /Sede/ }), "Subdirección de Salud");
    fireEvent.change(screen.getByLabelText(/^Fecha/), { target: { value: fechaMinimaCita() } });
    await user.selectOptions(screen.getByRole("combobox", { name: /Horario de ejemplo/ }), "10:30");
    await user.click(screen.getByRole("checkbox", { name: /Entiendo que es una simulación/ }));
    await user.click(screen.getByRole("button", { name: "Revisar solicitud" }));

    expect(await screen.findByText("No es una cita confirmada.")).toBeInTheDocument();
    expect(screen.queryByText(/^cita confirmada/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Enviar solicitud de cita simulada" }));

    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/gestiones\//));
    const gestiones = await repositories.procedures.list(ANA);
    const cita = gestiones.find((g) => g.servicioId === "mid-bih-400");
    expect(cita?.datos.referenciaCita).toMatch(/^DEMO-C-\d{7}$/);
    expect(cita?.folio).toMatch(/^DEMO-G-\d{7}$/);
  });
});

describe("VerificationFlow (visitas domiciliarias)", () => {
  it("consulta credenciales FICTICIAS y nunca valida una identificación real", async () => {
    const { user } = renderRecorrido("padron-visitadores");
    const campo = await screen.findByRole("textbox", { name: /Código de la credencial/ });
    await user.type(campo, "ejemplo-v-0001");
    await user.click(screen.getByRole("button", { name: "Consultar" }));
    expect(await screen.findByText("Persona ficticia de demostración")).toBeInTheDocument();
    expect(screen.getByText(/no valida a ninguna persona real/)).toBeInTheDocument();

    await user.clear(campo);
    await user.type(campo, "INE-123456");
    await user.click(screen.getByRole("button", { name: "Consultar" }));
    expect(await screen.findByText("Este prototipo no valida credenciales reales")).toBeInTheDocument();
    expect(screen.queryByText(/validada|identidad confirmada/i)).not.toBeInTheDocument();
  });
});

describe("Servicio inexistente", () => {
  it("muestra un estado vacío útil con h1", async () => {
    renderRecorrido("no-existe");
    expect(await screen.findByRole("heading", { level: 1, name: "No encontramos este servicio" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir al catálogo" })).toHaveAttribute("href", "/servicios");
  });
});
