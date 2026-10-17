import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { CLAVE_AVISO_COOKIES, CLAVE_AVISO_SESION } from "../aviso-cookies";
import { DOCUMENTOS_LEGALES } from "../documentos";
import { LegalFooter } from "./LegalFooter";

beforeEach(() => { window.localStorage.clear(); window.sessionStorage.clear(); });

describe("Footer y aviso de cookies", () => {
  it("ofrece los cuatro documentos y recuerda solo la lectura tras aceptar", async () => {
    const vista = renderWithProviders(<LegalFooter />);
    const dialogo = screen.getByRole("dialog", { name: "Cookies y tu privacidad" });
    expect(within(dialogo).getByText(/no autoriza tu ubicación/i)).toBeInTheDocument();
    await vista.user.click(within(dialogo).getByRole("button", { name: "Aceptar y continuar" }));
    expect(window.localStorage.getItem(CLAVE_AVISO_COOKIES)).toBe("leido");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Información legal" });
    for (const documento of DOCUMENTOS_LEGALES) {
      expect(within(nav).getByRole("link", { name: documento.titulo })).toHaveAttribute("href", `/legal/${documento.slug}`);
    }
    vista.unmount();
    renderWithProviders(<LegalFooter />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("permite aplazar sin registrar aceptación y reabrir el aviso con retorno del foco", async () => {
    const { user } = renderWithProviders(<LegalFooter />);
    await user.click(screen.getByRole("button", { name: "Ahora no" }));
    expect(window.localStorage.getItem(CLAVE_AVISO_COOKIES)).toBeNull();
    expect(window.sessionStorage.getItem(CLAVE_AVISO_SESION)).toBe("aplazado");
    const abrir = screen.getByRole("button", { name: "Revisar aviso de cookies" });
    await user.click(abrir);
    expect(screen.getByRole("heading", { name: "Cookies y tu privacidad" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(abrir).toHaveFocus();
  });

  it.each(["/bienestar", "/bienestar/linea-mujer", "/legal/aviso-privacidad", "/operaciones"])("no antepone un modal a %s", (ruta) => {
    renderWithProviders(<LegalFooter />, { ruta });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revisar aviso de cookies" })).toBeInTheDocument();
  });

  it("deja leer la política sin obligar a aceptar", async () => {
    const { user, router } = renderWithProviders(<LegalFooter />, { rutasExtra: [{ path: "/legal/politica-cookies", element: <h1>Política de Cookies</h1> }] });
    await user.click(within(screen.getByRole("dialog")).getByRole("link", { name: "Consultar la Política de Cookies" }));
    expect(router.state.location.pathname).toBe("/legal/politica-cookies");
    expect(window.localStorage.getItem(CLAVE_AVISO_COOKIES)).toBeNull();
  });

  it("no bloquea la navegación si el navegador rechaza guardar la elección", async () => {
    const { user } = renderWithProviders(<LegalFooter />);
    const guardar = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("bloqueado"); });
    await user.click(screen.getByRole("button", { name: "Aceptar y continuar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("no permitió guardar");
    guardar.mockRestore();
  });
});
