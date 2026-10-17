import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { PrivacidadSection } from "./PrivacidadSection";

describe("PrivacidadSection", () => {
  it("la confirmación antes de reutilizar siempre está activa y no se puede apagar", async () => {
    renderWithProviders(<PrivacidadSection />);
    const confirmacion = await screen.findByRole("switch", { name: "Pedir confirmación antes de reutilizar mis datos" });
    expect(confirmacion).toBeChecked();
    expect(confirmacion).toBeDisabled();
  });

  it("guarda una preferencia editable", async () => {
    const { user } = renderWithProviders(<PrivacidadSection />);
    const discretas = await screen.findByRole("switch", { name: "Notificaciones discretas" });
    expect(discretas).not.toBeChecked();
    expect(discretas).toHaveAttribute("data-guia", "expediente.privacidad_notificaciones_discretas");
    await user.click(discretas);
    await waitFor(() => expect(screen.getByRole("switch", { name: "Notificaciones discretas" })).toBeChecked());
  });
});
