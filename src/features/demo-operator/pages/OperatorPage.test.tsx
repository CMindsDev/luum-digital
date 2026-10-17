import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useDemoSession } from "@/app/session/store";
import { crearRepositoriosDemo } from "@/services/adapters/demo";
import { renderWithProviders } from "@/test/renderWithProviders";
import OperatorPage from "./OperatorPage";

function renderizar(identidadId: string) {
  useDemoSession.setState({ identidadId });
  const repositories = crearRepositoriosDemo();
  const resultado = renderWithProviders(<OperatorPage />, {
    ruta: "/operador",
    patron: "/operador",
    repositories,
    rutasExtra: [{ path: "/cuenta", element: <h1>Cuenta</h1> }],
  });
  return { ...resultado, repositories };
}

describe("Operador de demostración", () => {
  afterEach(() => {
    useDemoSession.setState({ identidadId: "ana" });
  });

  it("a la ciudadanía le explica cómo cambiar de identidad y no ofrece acciones de operación", async () => {
    renderizar("ana");
    expect(await screen.findByRole("heading", { level: 1, name: "Operador de demostración" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Esta vista es para la operación de demostración" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Cambiar de identidad en «Cuenta»/ })).toHaveAttribute("href", "/cuenta");
    expect(screen.getByText(/no es seguridad ni autorización de producción/)).toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("al operador le muestra el aviso, la cola con criterios de prioridad y las pestañas", async () => {
    renderizar("operador");
    expect(await screen.findByRole("tab", { name: "Cola de reportes" })).toBeInTheDocument();
    expect(screen.getByText(/no es seguridad ni autorización de producción/)).toBeInTheDocument();
    expect(screen.getByText(/No depende de cuántas personas reportan ni de puntos/)).toBeInTheDocument();
    const cola = await screen.findByRole("list", { name: /Cola de reportes, de mayor a menor prioridad/ });
    const primera = within(cola).getAllByRole("listitem")[0];
    expect(primera).toBeDefined();
    expect(within(primera!).getByText(/Prioridad (alta|media|baja)/)).toBeInTheDocument();
    expect(within(primera!).getByRole("list", { name: "Criterios de la prioridad" })).toBeInTheDocument();
  });

  it("registra la atención de un reporte en proceso y el reporte queda solucionado", async () => {
    const { user, repositories } = renderizar("operador");
    await user.click(await screen.findByRole("radio", { name: "En proceso" }));
    let registrar: HTMLElement | null = null;
    // La cola está paginada: se despliega «Mostrar más» hasta encontrar el reporte.
    for (let intento = 0; intento < 4 && !registrar; intento += 1) {
      registrar = await screen.findByRole("button", { name: /Registrar atención\s*de DEMO-R-0000010/ }, { timeout: 300 }).catch(() => null);
      if (!registrar) await user.click(await screen.findByRole("button", { name: /^Mostrar más/ }));
    }
    if (!registrar) throw new Error("El reporte DEMO-R-0000010 no apareció en la cola.");
    await user.click(registrar);

    const dialogo = await screen.findByRole("dialog", { name: /Registrar atención\s*de DEMO-R-0000010/ });
    expect(within(dialogo).getByText(/abre la verificación ciudadana/)).toBeInTheDocument();
    await user.click(within(dialogo).getByRole("button", { name: "Registrar atención" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: /Registrar atención\s*de DEMO-R-0000010/ })).not.toBeInTheDocument());

    const reporte = await repositories.reports.get("rep-0010");
    expect(reporte?.estadoMunicipal).toBe("solucionado");
    expect(reporte?.verificacion).toBe("pendiente");
    await user.click(screen.getByRole("tab", { name: /^Registro/ }));
    expect(await screen.findByText(/DEMO-R-0000010: atención registrada/)).toBeInTheDocument();
  });

  it("aprobar acredita una sola vez y repetir la aprobación no duplica los puntos", async () => {
    const { user, repositories } = renderizar("operador");
    await user.click(await screen.findByRole("tab", { name: /^Verificaciones/ }));
    await user.click(await screen.findByRole("button", { name: /Aprobar\s*la verificación de DEMO-R-0000006/ }));
    await user.click(await screen.findByRole("button", { name: "Aprobar y acreditar" }));
    await user.click(await screen.findByRole("radio", { name: /^Revisadas/ }));
    await user.click(await screen.findByRole("button", { name: /Repetir aprobación\s*de DEMO-R-0000006/ }));
    await user.click(screen.getByRole("tab", { name: /^Registro/ }));
    expect(await screen.findByText(/Aprobación repetida de DEMO-R-0000006: ya estaba aprobada, no se acreditaron puntos de nuevo/)).toBeInTheDocument();

    const bruno = { id: "bruno", nombre: "Bruno Canul", iniciales: "BC", rol: "ciudadania", descripcion: "" } as const;
    const movimientos = (await repositories.rewards.listMovements(bruno)).filter((m) => m.claveEvento === "verificacion:ver-0002:aprobada");
    expect(movimientos).toHaveLength(1);
    expect(movimientos[0]).toMatchObject({ estado: "aprobado", puntos: 30 });
    expect((await repositories.rewards.getBalance(bruno)).disponible).toBe(70);
  });
});
