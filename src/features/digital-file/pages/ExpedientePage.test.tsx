import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import ExpedientePage from "./ExpedientePage";

describe("ExpedientePage", () => {
  it("perfil ficticio con leyenda, documentos de ejemplo y un solo h1", async () => {
    renderWithProviders(<ExpedientePage />, { ruta: "/expediente", patron: "/expediente" });
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Mi expediente" })).toBeInTheDocument();

    const perfil = screen.getByRole("region", { name: "Perfil ficticio" });
    expect(await within(perfil).findByText("ana.ek@ejemplo.mx")).toBeInTheDocument();
    expect(within(perfil).getByText("Datos ficticios de demostración")).toBeInTheDocument();

    const documentos = screen.getByRole("region", { name: "Documentos de ejemplo" });
    expect(await within(documentos).findByRole("link", { name: /Identificación de ejemplo/ })).toHaveAttribute(
      "href",
      "/expediente/documentos/doc-ana-identificacion",
    );
    expect(within(documentos).getAllByText("DOCUMENTO DE EJEMPLO")).toHaveLength(3);

    expect(screen.getByRole("region", { name: "Cuenta de demostración compartida" })).toHaveTextContent(
      "No es una cuenta ni una autenticación municipal",
    );
  });

  it("muestra qué datos del expediente se reutilizaron en cada gestión relacionada", async () => {
    renderWithProviders(<ExpedientePage />, { ruta: "/expediente", patron: "/expediente" });
    const gestiones = screen.getByRole("region", { name: "Gestiones relacionadas" });
    const enlace = await within(gestiones).findByRole("link", { name: /Copia Simple de Cédula Catastral Vigente/ });
    expect(enlace).toHaveAttribute("href", "/gestiones/ges-0001");
    expect(within(gestiones).getByText("Nombre completo:").parentElement).toHaveTextContent("Nombre completo: Ana Ek Canché");
    expect(within(gestiones).getByText("Correo electrónico:").parentElement).toHaveTextContent("Correo electrónico: ana.ek@ejemplo.mx");
  });

  it("nunca pide CURP, INE ni comprobantes reales", async () => {
    renderWithProviders(<ExpedientePage />, { ruta: "/expediente", patron: "/expediente" });
    await screen.findByText("ana.ek@ejemplo.mx");
    expect(screen.queryByRole("textbox", { name: /CURP|INE|comprobante/i })).not.toBeInTheDocument();
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });
});
