import { fireEvent, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSalidaRapidaConEscape } from "../hooks/useSalidaRapida";
import { DESTINO_SALIDA_RAPIDA, esDobleEscape, salirRapido, VENTANA_DOBLE_ESCAPE_MS } from "./salida-rapida";

describe("salida rápida", () => {
  it("detecta el doble Escape sólo dentro de la ventana", () => {
    expect(esDobleEscape(null, 500)).toBe(false);
    expect(esDobleEscape(1000, 1000 + VENTANA_DOBLE_ESCAPE_MS)).toBe(true);
    expect(esDobleEscape(1000, 1000 + VENTANA_DOBLE_ESCAPE_MS + 1)).toBe(false);
    expect(esDobleEscape(1000, 900)).toBe(false);
  });

  it("reemplaza la página por la neutral (sin texto de la persona en la URL)", () => {
    const reemplazar = vi.fn();
    salirRapido(reemplazar);
    expect(reemplazar).toHaveBeenCalledWith(DESTINO_SALIDA_RAPIDA);
    expect(new URL(DESTINO_SALIDA_RAPIDA).search).toBe("");
  });

  it("Escape dos veces seguidas sale; una sola vez, no", () => {
    const salir = vi.fn();
    const { unmount } = renderHook(() => useSalidaRapidaConEscape(salir));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(salir).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(salir).toHaveBeenCalledTimes(1);
    // Otra tecla en medio no cuenta como Escape.
    fireEvent.keyDown(window, { key: "a" });
    expect(salir).toHaveBeenCalledTimes(1);
    unmount();
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(salir).toHaveBeenCalledTimes(1);
  });

  it("ignora la repetición automática de una tecla sostenida", () => {
    const salir = vi.fn();
    renderHook(() => useSalidaRapidaConEscape(salir));
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.keyDown(window, { key: "Escape", repeat: true });
    expect(salir).not.toHaveBeenCalled();
  });
});
