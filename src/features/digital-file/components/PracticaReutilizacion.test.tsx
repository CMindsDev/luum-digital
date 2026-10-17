import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { PracticaReutilizacion } from "./PracticaReutilizacion";

describe("PracticaReutilizacion", () => {
  it("no copia nada por omisión y sólo copia los datos que se confirman uno por uno", async () => {
    const { user } = renderWithProviders(<PracticaReutilizacion />);
    await user.click(screen.getByRole("button", { name: "Usar datos de mi expediente" }));
    const dialogo = await screen.findByRole("dialog", { name: "Usar datos de mi expediente" });

    const telefono = await within(dialogo).findByRole("checkbox", { name: "Teléfono" });
    for (const casilla of within(dialogo).getAllByRole("checkbox")) expect(casilla).not.toBeChecked();
    expect(within(dialogo).getByRole("button", { name: "Elige al menos un dato" })).toBeDisabled();

    await user.click(telefono);
    const copiar = within(dialogo).getByRole("button", { name: "Copiar 1 dato" });
    expect(copiar).toHaveAttribute("data-guia", "expediente.confirmar_reutilizar");
    await user.click(copiar);

    expect(screen.getByRole("textbox", { name: /Teléfono/ })).toHaveValue("999 000 0001");
    expect(screen.getByRole("textbox", { name: /Nombre completo/ })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: /Correo electrónico/ })).toHaveValue("");
    expect(screen.getByText("Copiado de tu expediente con tu confirmación")).toBeInTheDocument();
  });

  it("valida con zod, enfoca el primer error y confirma sin enviar nada", async () => {
    const { user } = renderWithProviders(<PracticaReutilizacion />);
    await user.click(screen.getByRole("button", { name: "Comprobar datos" }));

    const nombre = screen.getByRole("textbox", { name: /Nombre completo/ });
    await waitFor(() => expect(nombre).toHaveFocus());
    expect(nombre).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Revisa 3 campos marcados.");

    await user.type(nombre, "Persona de Ejemplo");
    await user.type(screen.getByRole("textbox", { name: /Correo electrónico/ }), "persona@ejemplo.mx");
    await user.type(screen.getByRole("textbox", { name: /Teléfono/ }), "999 000 0000");
    await user.click(screen.getByRole("button", { name: "Comprobar datos" }));

    const titulo = await screen.findByRole("heading", { name: "Datos comprobados" });
    await waitFor(() => expect(titulo).toHaveFocus());
    expect(screen.getByText(/Ninguno vino de tu expediente\. No se envió ni se guardó nada\./)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Probar otra vez" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Usar datos de mi expediente" })).toHaveFocus());
    expect(screen.getByRole("textbox", { name: /Nombre completo/ })).toHaveValue("");
  });
});
