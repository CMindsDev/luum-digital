import { describe, expect, it } from "vitest";
import type { DocumentoDemo } from "@/types";
import { documentosDeGestion, lineasVistaPrevia, MARCA_DOCUMENTO_EJEMPLO, rutaDocumento } from "./documentos";

const base: DocumentoDemo = {
  id: "doc-1",
  identidadId: "ana",
  titulo: "Identificación de ejemplo",
  tipo: "identificacion_ejemplo",
  fecha: "2026-10-01T10:00:00.000Z",
  vistaPrevia: [MARCA_DOCUMENTO_EJEMPLO, "Nombre: Ana Ek Canché", "  ", "documento de ejemplo", "Sin validez oficial."],
  gestionesRelacionadas: ["ges-1"],
};

describe("documentos del expediente", () => {
  it("separa la marca de las líneas de la vista previa (la marca se dibuja siempre aparte)", () => {
    expect(lineasVistaPrevia(base)).toEqual(["Nombre: Ana Ek Canché", "Sin validez oficial."]);
  });

  it("encuentra los documentos ligados a una gestión", () => {
    expect(documentosDeGestion([base], "ges-1")).toEqual([base]);
    expect(documentosDeGestion([base], "ges-2")).toEqual([]);
  });

  it("codifica el id en la ruta interna", () => {
    expect(rutaDocumento("doc/1")).toBe("/expediente/documentos/doc%2F1");
  });
});
