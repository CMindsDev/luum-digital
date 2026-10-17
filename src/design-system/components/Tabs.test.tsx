import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Tabs } from "./Tabs";

const PESTANAS = [
  { id: "todos", etiqueta: "Todos", contenido: <p>Lista completa</p> },
  { id: "abiertos", etiqueta: "Abiertos", contenido: <p>Sólo abiertos</p> },
  { id: "cerrados", etiqueta: "Cerrados", contenido: <p>Sólo cerrados</p> },
];

describe("Tabs", () => {
  it("usa roving tabindex y cambia de pestaña con flechas, Inicio y Fin", async () => {
    const user = userEvent.setup();
    const onCambiar = vi.fn();
    render(<Tabs etiqueta="Filtrar reportes" pestanas={PESTANAS} onCambiar={onCambiar} />);

    const lista = screen.getByRole("tablist", { name: "Filtrar reportes" });
    expect(lista).toBeInTheDocument();
    const [todos, abiertos, cerrados] = screen.getAllByRole("tab");
    expect(todos).toHaveAttribute("aria-selected", "true");
    expect(todos).toHaveAttribute("tabindex", "0");
    expect(abiertos).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Lista completa");

    await user.tab();
    expect(todos).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(abiertos).toHaveFocus();
    expect(abiertos).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Sólo abiertos");
    expect(onCambiar).toHaveBeenLastCalledWith("abiertos");

    await user.keyboard("{End}");
    expect(cerrados).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(todos).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(cerrados).toHaveFocus();
    await user.keyboard("{Home}");
    expect(todos).toHaveFocus();
    expect(screen.getByRole("tabpanel", { name: "Todos" })).toHaveTextContent("Lista completa");
  });
});
