import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { BandaTematica, type BandaTematicaProps } from "./BandaTematica";

function renderizar(props: Partial<BandaTematicaProps> = {}) {
  return render(
    <MemoryRouter>
      <BandaTematica
        tono="salud"
        lineaSans="Salud y"
        lineaSerif="Bienestar"
        pie="Programas municipales de salud, con su fuente oficial."
        icono="/brand/laboratorio/tablero/icono-seccion-salud.svg"
        foto={{ src: "/brand/laboratorio/tablero/foto-salud-bienestar.jpg" }}
        enlaces={[{ etiqueta: "Ver programas", to: "/bienestar", guia: "inicio.tema_salud" }]}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("BandaTematica", () => {
  it("expone un encabezado con las dos líneas del titular y una región con su nombre", () => {
    renderizar();
    const encabezado = screen.getByRole("heading", { level: 2, name: "Salud y Bienestar" });
    expect(encabezado).toBeInTheDocument();
    // La segunda línea es énfasis visual (clase), no un elemento <em> que cambie la lectura.
    expect(encabezado.querySelector("em")).toBeNull();
    const region = screen.getByRole("region", { name: "Salud y Bienestar" });
    expect(within(region).getByRole("heading", { level: 2 })).toBe(encabezado);
  });

  it("el enlace es accesible por nombre, apunta a su ruta y conserva el identificador del asistente", () => {
    renderizar();
    const enlace = screen.getByRole("link", { name: "Ver programas" });
    expect(enlace).toHaveAttribute("href", "/bienestar");
    expect(enlace).toHaveAttribute("data-guia", "inicio.tema_salud");
  });

  it("el pie es un párrafo (no un encabezado) y el ícono y la foto son decorativos", () => {
    const { container } = renderizar();
    expect(screen.getByText(/Programas municipales de salud/).tagName).toBe("P");
    expect(screen.getAllByRole("heading")).toHaveLength(1);
    const icono = container.querySelector('img[src$="icono-seccion-salud.svg"]');
    expect(icono).toHaveAttribute("alt", "");
    expect(icono).toHaveAttribute("aria-hidden", "true");
    const foto = container.querySelector('img[src$="foto-salud-bienestar.jpg"]');
    expect(foto).toHaveAttribute("alt", "");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("con nivel 1 el titular es el h1 y puede recibir el foco al cambiar de ruta", () => {
    renderizar({ nivel: 1 });
    const h1 = screen.getByRole("heading", { level: 1, name: "Salud y Bienestar" });
    expect(h1).toHaveAttribute("tabindex", "-1");
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
  });

  it("usa la foto con texto alternativo cuando se da y admite bandas sin foto ni enlaces", () => {
    renderizar({ foto: { src: "/brand/laboratorio/tablero/foto-movilidad-transito.jpg", alt: "Avenida con tránsito" }, enlaces: [] });
    expect(screen.getByRole("img", { name: "Avenida con tránsito" })).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("aplica el tono: magenta fuerte con texto blanco en Seguridad y café sobre lima en Trámites", () => {
    const { container, rerender } = renderizar({ tono: "seguridad", lineaSans: "Seguridad y", lineaSerif: "Protección" });
    const banda = container.querySelector("section");
    expect(banda).toHaveAttribute("data-tono", "seguridad");
    expect(banda).toHaveClass("bg-magenta-fuerte", "text-white");
    rerender(
      <MemoryRouter>
        <BandaTematica tono="tramites" lineaSans="Trámites y" lineaSerif="Atención" />
      </MemoryRouter>,
    );
    expect(container.querySelector("section")).toHaveClass("bg-lima", "text-cafe");
  });
});
