import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { MapaInteractivoProps } from "./MapaInteractivo";
import { SelectorUbicacion } from "./SelectorUbicacion";

/** Doble del mapa: permite simular un toque, el control de cámara y un fallo, sin WebGL. */
vi.mock("./MapaInteractivo", () => ({
  MapaInteractivo: (props: MapaInteractivoProps) => {
    const falla = document.body.dataset.mapaFalla === "1";
    if (falla) return <div>{props.respaldo({ motivo: "Prueba.", reintentar: () => undefined })}</div>;
    return (
      <div>
        <button type="button" onClick={() => props.onClic?.({ posicion: { lat: 20.967123456, lng: -89.623749 }, objetos: [] })}>
          Tocar Mérida
        </button>
        <button type="button" onClick={() => props.onClic?.({ posicion: { lat: 19.43, lng: -99.13 }, objetos: [] })}>
          Tocar fuera
        </button>
        <button
          type="button"
          onClick={() => props.onControl?.({ volarA: () => undefined, centro: () => ({ lat: 21.0, lng: -89.6 }), zoom: () => 12 })}
        >
          Listo
        </button>
      </div>
    );
  },
}));

describe("SelectorUbicacion", () => {
  it("marca el punto tocado (redondeado) y rechaza puntos fuera de Mérida", async () => {
    const usuario = userEvent.setup();
    const onCambiar = vi.fn();
    const { rerender } = render(<SelectorUbicacion valor={null} onCambiar={onCambiar} etiqueta="Ubicación del reporte" />);
    expect(screen.getByRole("group", { name: "Ubicación del reporte" })).toBeInTheDocument();
    expect(screen.getByText("Aún no marcas un punto en el mapa.")).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Tocar fuera" }));
    expect(screen.getByRole("alert")).toHaveTextContent("fuera del municipio de Mérida");
    expect(onCambiar).not.toHaveBeenCalled();

    await usuario.click(screen.getByRole("button", { name: "Tocar Mérida" }));
    expect(onCambiar).toHaveBeenCalledWith({ lat: 20.96712, lng: -89.62375 });
    rerender(<SelectorUbicacion valor={{ lat: 20.96712, lng: -89.62375 }} onCambiar={onCambiar} etiqueta="Ubicación del reporte" />);
    expect(screen.getByText("20.96712, -89.62375")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("con teclado: «Marcar el centro del mapa» usa el centro de la cámara cuando el mapa está listo", async () => {
    const usuario = userEvent.setup();
    const onCambiar = vi.fn();
    render(<SelectorUbicacion valor={null} onCambiar={onCambiar} etiqueta="Ubicación" guia="reportes" />);
    const marcar = screen.getByRole("button", { name: "Marcar el centro del mapa" });
    expect(marcar).toBeDisabled();
    expect(marcar).toHaveAttribute("data-guia", "reportes.marcar_centro");
    await usuario.click(screen.getByRole("button", { name: "Listo" }));
    expect(marcar).toBeEnabled();
    await usuario.click(marcar);
    expect(onCambiar).toHaveBeenCalledWith({ lat: 21, lng: -89.6 });
  });

  it("si el mapa falla muestra un aviso y no bloquea el formulario", () => {
    document.body.dataset.mapaFalla = "1";
    try {
      render(<SelectorUbicacion valor={null} onCambiar={() => undefined} etiqueta="Ubicación" />);
      expect(screen.getByRole("status")).toHaveTextContent("El mapa no está disponible.");
      expect(screen.getByRole("status")).toHaveTextContent("el formulario no depende del mapa");
      expect(screen.getByRole("button", { name: "Reintentar el mapa" })).toBeInTheDocument();
    } finally {
      delete document.body.dataset.mapaFalla;
    }
  });
});
