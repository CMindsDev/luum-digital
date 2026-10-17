import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Toaster } from "@/design-system";
import { cambiarIdioma, i18n } from "@/i18n";
import { SelectorIdioma } from "./SelectorIdioma";

afterEach(async () => {
  vi.restoreAllMocks();
  await cambiarIdioma("es");
});

describe("SelectorIdioma", () => {
  it("permite cambiar entre maya y español y conserva el nombre nativo del idioma destino", async () => {
    render(<SelectorIdioma />);
    fireEvent.click(screen.getByRole("button", { name: "Cambiar idioma a Maya yucateco" }));
    await waitFor(() => expect(document.documentElement.lang).toBe("yua"));
    const volver = screen.getByRole("button");
    expect(volver).toHaveTextContent("Español");
    await waitFor(() => expect(volver).toBeEnabled());
    fireEvent.click(volver);
    await waitFor(() => expect(document.documentElement.lang).toBe("es-MX"));
  });

  it("muestra un error y permite reintentar si no puede cambiar el idioma", async () => {
    vi.spyOn(i18n, "changeLanguage").mockRejectedValueOnce(new Error("sin conexión"));
    render(<><SelectorIdioma /><Toaster /></>);
    const selector = screen.getByRole("button", { name: "Cambiar idioma a Maya yucateco" });
    fireEvent.click(selector);
    await screen.findByText("No se pudo completar");
    expect(document.documentElement.lang).toBe("es-MX");
    expect(selector).toBeEnabled();
    fireEvent.click(selector);
    await waitFor(() => expect(document.documentElement.lang).toBe("yua"));
  });
});
