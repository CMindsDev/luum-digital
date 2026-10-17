import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./StatusBadge";
import { VerificationBadge } from "./VerificationBadge";

describe("StatusBadge", () => {
  it("comunica el estado con texto e ícono, no sólo con color", () => {
    const { container } = render(<StatusBadge estado="en_proceso" />);
    expect(screen.getByText("En proceso de atención")).toBeVisible();
    expect(container).toHaveTextContent("Estado municipal: En proceso de atención");
    const iconos = container.querySelectorAll("svg[aria-hidden='true']");
    expect(iconos.length).toBe(1);
  });

  it("incluye el motivo de cancelación", () => {
    render(<StatusBadge estado="cancelado" motivo="duplicado" />);
    expect(screen.getByText("Cancelado: Duplicado")).toBeInTheDocument();
  });

  it.each([
    ["registrado", "Registrado"],
    ["solucionado", "Solucionado"],
  ] as const)("muestra la etiqueta de Mérida Móvil para %s", (estado, texto) => {
    render(<StatusBadge estado={estado} />);
    expect(screen.getByText(texto)).toBeInTheDocument();
  });
});

describe("VerificationBadge", () => {
  it("distingue la verificación ciudadana del estado municipal", () => {
    const { container } = render(<VerificationBadge estado="discrepancia" />);
    expect(container).toHaveTextContent("Verificación ciudadana: Discrepancia");
  });
});
