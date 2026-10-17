import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import DocumentoPage from "./DocumentoPage";

function renderDocumento(id: string) {
  return renderWithProviders(<DocumentoPage />, { ruta: `/expediente/documentos/${id}`, patron: "/expediente/documentos/:documentoId" });
}

describe("DocumentoPage", () => {
  it("muestra la vista previa con la marca DOCUMENTO DE EJEMPLO y la gestión ligada", async () => {
    renderDocumento("doc-ana-identificacion");
    expect(await screen.findByRole("heading", { level: 1, name: "Identificación de ejemplo" })).toBeInTheDocument();
    const vistaPrevia = screen.getByRole("figure", { name: "Identificación de ejemplo" });
    expect(vistaPrevia).toHaveTextContent("DOCUMENTO DE EJEMPLO");
    expect(vistaPrevia).toHaveTextContent("Sin validez oficial");
    expect(await screen.findByRole("link", { name: /Copia Simple de Cédula Catastral Vigente/ })).toHaveAttribute("href", "/gestiones/ges-0001");
    expect(screen.queryByRole("link", { name: /descargar/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("no muestra documentos de otra identidad", async () => {
    renderDocumento("doc-bruno-constancia");
    expect(await screen.findByRole("heading", { level: 1, name: "Documento no encontrado" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a mi expediente" })).toHaveAttribute("href", "/expediente");
  });
});
