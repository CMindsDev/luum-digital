import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

function Ejemplo() {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <Button onClick={() => setAbierto(true)}>Abrir diálogo</Button>
      <Dialog
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Confirmar envío"
        descripcion="Revisa los datos antes de continuar."
        acciones={
          <>
            <Button variante="secundario" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button>Enviar</Button>
          </>
        }
      >
        <label htmlFor="nota">Nota</label>
        <input id="nota" />
      </Dialog>
    </>
  );
}

describe("Dialog", () => {
  it("enfoca el título al abrir, atrapa el foco con Tab y lo devuelve al cerrar con Escape", async () => {
    const user = userEvent.setup();
    render(<Ejemplo />);
    const abrir = screen.getByRole("button", { name: "Abrir diálogo" });
    await user.click(abrir);

    const dialogo = screen.getByRole("dialog", { name: "Confirmar envío" });
    expect(dialogo).toHaveAccessibleDescription("Revisa los datos antes de continuar.");
    expect(screen.getByRole("heading", { name: "Confirmar envío" })).toHaveFocus();

    // Orden: Cerrar (✕) → Nota → Cancelar → Enviar → vuelve a Cerrar.
    await user.tab();
    expect(screen.getByRole("button", { name: "Cerrar" })).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText("Nota")).toHaveFocus();
    await user.tab();
    await user.tab();
    expect(screen.getByRole("button", { name: "Enviar" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Cerrar" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Enviar" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("heading", { name: "Confirmar envío" })).not.toBeInTheDocument();
    expect(abrir).toHaveFocus();
  });

  it("devuelve el foco al cerrar con el botón ✕", async () => {
    const user = userEvent.setup();
    render(<Ejemplo />);
    const abrir = screen.getByRole("button", { name: "Abrir diálogo" });
    await user.click(abrir);
    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("heading", { name: "Confirmar envío" })).not.toBeInTheDocument();
    expect(abrir).toHaveFocus();
  });
});
