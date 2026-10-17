import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import WomenSupportPage from "./WomenSupportPage";

describe("Línea Mujer", () => {
  it("distingue consultar información, abrir el canal oficial y simular una solicitud", async () => {
    renderWithProviders(<WomenSupportPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Línea Mujer" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Consultar información" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Abrir el canal oficial" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Simular una solicitud" })).toBeInTheDocument();
    // Servicios verificados: atención especializada, refugio y app descrita sin integrarla.
    expect(await screen.findByRole("heading", { name: /Atención Especializada/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Refugio/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "App oficial «Línea Mujer»" })).toBeInTheDocument();
    // Consultar no tiene enlaces tel: (sólo texto).
    const informacion = screen.getByRole("heading", { level: 2, name: "Consultar información" }).closest("section");
    expect(informacion?.querySelector("a[href^='tel:']")).toBeNull();
    expect(screen.getByText(/No borra tu historial de navegación ni garantiza ocultar tu actividad/)).toBeInTheDocument();
  });

  it("llamar requiere confirmar y muestra el número verificado (no se marca solo)", async () => {
    const { user } = renderWithProviders(<WomenSupportPage />);
    const llamar = await screen.findByRole("button", { name: "Llamar a Línea Mujer" });
    expect(document.querySelector("a[href='tel:8004557672']")).toBeNull();
    await user.click(llamar);
    const dialogo = await screen.findByRole("dialog", { name: "¿Llamar a Línea Mujer?" });
    expect(within(dialogo).getByRole("link", { name: /Llamar al 800 455 76 72/ })).toHaveAttribute("href", "tel:8004557672");
    expect(within(dialogo).getByText(/no envía alertas, ubicación ni mensajes/)).toBeInTheDocument();
    await user.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog", { name: "¿Llamar a Línea Mujer?" })).not.toBeInTheDocument();
  });

  it("la solicitud simulada dice que nadie la recibió", async () => {
    const { user } = renderWithProviders(<WomenSupportPage />);
    await user.click(screen.getByRole("button", { name: "Simular solicitud" }));
    expect(await screen.findByText("Solicitud simulada: nadie la ha recibido.")).toBeInTheDocument();
    expect(screen.getByText(/DEMO-S-\d+/)).toBeInTheDocument();
    expect(screen.getByText(/no hay cita, seguimiento ni persona asignada/)).toBeInTheDocument();
  });
});
