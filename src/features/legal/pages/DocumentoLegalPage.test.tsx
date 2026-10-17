import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { DOCUMENTOS_LEGALES } from "../documentos";
import DocumentoLegalPage from "./DocumentoLegalPage";

describe("Documentos legales", () => {
  it.each(DOCUMENTOS_LEGALES)("permite leer $titulo y sus referencias", (documento) => {
    renderWithProviders(<DocumentoLegalPage slug={documento.slug} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(documento.titulo);
    expect(screen.getByText(/no sustituyen los avisos oficiales/)).toBeInTheDocument();
    for (const seccion of documento.secciones) {
      expect(screen.getByRole("heading", { level: 2, name: seccion.titulo })).toHaveAttribute("id", seccion.id);
    }
    for (const link of screen.getAllByRole("link").filter((el) => el.getAttribute("target") === "_blank")) {
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link).toHaveAccessibleName(/abre otra pestaña/);
    }
  });
});
