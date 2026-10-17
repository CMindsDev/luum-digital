import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
// La mascota es el componente del asistente (Pekito); este archivo sólo verifica su contrato de
// accesibilidad y de movimiento reducido como parte de la alineación del design system.
import { PekitoMascota } from "@/features/assistant/ui/PekitoMascota";

describe("Mascota del asistente (Pekito)", () => {
  it("es decorativa: alt vacío, aria-hidden y sin arrastre de imagen", () => {
    const { container } = render(<PekitoMascota />);
    const imagen = container.querySelector("img");
    expect(imagen).not.toBeNull();
    expect(imagen).toHaveAttribute("alt", "");
    expect(imagen).toHaveAttribute("aria-hidden", "true");
    expect(imagen).toHaveAttribute("draggable", "false");
    expect(imagen?.getAttribute("src")).toMatch(/pekito-mascota\.svg$/);
  });

  it("conserva la proporción del diseño al cambiar el ancho", () => {
    const { container } = render(<PekitoMascota ancho={120} />);
    const imagen = container.querySelector("img");
    expect(imagen).toHaveAttribute("width", "120");
    expect(imagen).toHaveAttribute("height", String(Math.round((120 * 198.681) / 212.885)));
  });

  it("en reposo no tiene animación; sólo con respira usa la clase que pekito.css apaga con movimiento reducido", () => {
    const quieta = render(<PekitoMascota />).container.querySelector("img");
    expect(quieta?.className).not.toContain("pekito-respira");
    const respirando = render(<PekitoMascota respira />).container.querySelector("img");
    expect(respirando).toHaveClass("pekito-respira");
  });

  it("con estado se dibuja animada: SVG decorativo con el estado, el cuerpo de Figma y las cuatro luces", () => {
    const { container } = render(<PekitoMascota ancho={120} estado="pensando" />);
    const svg = container.querySelector("svg");
    expect(container.querySelector("img")).toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("data-estado", "pensando");
    expect(svg).toHaveAttribute("width", "120");
    expect(svg).toHaveAttribute("height", String(Math.round((120 * 198.681) / 212.885)));
    expect(svg?.querySelector("image")?.getAttribute("href")).toMatch(/pekito-mascota\.svg$/);
    expect(svg?.querySelectorAll(".pk-luz")).toHaveLength(4);
    expect(svg?.querySelector(".pk-fx-pensar")).not.toBeNull();
  });

  it("modula con el nivel de voz y omite los efectos cuando es muy pequeña", () => {
    const grande = render(<PekitoMascota ancho={190} estado="hablando" nivel={0.8} />).container.querySelector("svg");
    expect(grande?.style.getPropertyValue("--nivel")).toBe("0.80");
    const pequena = render(<PekitoMascota ancho={38} estado="hablando" />).container.querySelector("svg");
    expect(pequena?.querySelector(".pk-fx")).toBeNull();
    expect(pequena?.querySelectorAll(".pk-luz")).toHaveLength(4);
  });
});
