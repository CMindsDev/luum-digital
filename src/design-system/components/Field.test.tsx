import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Field } from "./Field";
import { TextArea } from "./TextArea";
import { TextInput } from "./TextInput";

describe("Field", () => {
  it("asocia etiqueta, ayuda y error al control con aria-describedby y aria-invalid", () => {
    render(
      <Field etiqueta="Referencia" ayuda="Calle y cruzamientos." error="Escribe una referencia." requerido>
        <TextInput name="referencia" />
      </Field>,
    );
    const control = screen.getByLabelText(/Referencia/);
    expect(control).toHaveAttribute("aria-invalid", "true");
    expect(control).toHaveAttribute("aria-required", "true");
    expect(control).toHaveAccessibleDescription("Calle y cruzamientos. Escribe una referencia.");
  });

  it("sin error no marca aria-invalid y sólo describe con la ayuda", () => {
    render(
      <Field etiqueta="Correo" ayuda="Ficticio, sólo para la demo.">
        <TextInput type="email" />
      </Field>,
    );
    const control = screen.getByLabelText("Correo");
    expect(control).not.toHaveAttribute("aria-invalid");
    expect(control).toHaveAccessibleDescription("Ficticio, sólo para la demo.");
  });

  it("TextArea añade el contador a la descripción", () => {
    render(
      <Field etiqueta="Descripción" ayuda="Qué viste.">
        <TextArea maxLength={200} defaultValue="Bache" />
      </Field>,
    );
    const control = screen.getByLabelText("Descripción");
    expect(control).toHaveAccessibleDescription("Qué viste. 5 / 200 caracteres");
  });
});
