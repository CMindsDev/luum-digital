import { describe, expect, it } from "vitest";
import type { DocumentoDemo, Gestion } from "@/types";
import { etiquetaCampo, gestionesRelacionadas } from "./gestiones";

function gestion(parcial: Partial<Gestion> & Pick<Gestion, "id">): Gestion {
  return {
    folio: null,
    servicioId: "servicio",
    servicioNombre: "Servicio de ejemplo",
    identidadId: "ana",
    tipo: "formulario",
    estado: "borrador",
    datos: {},
    camposReutilizados: [],
    creadaEn: "2026-10-01T10:00:00.000Z",
    actualizadaEn: "2026-10-01T10:00:00.000Z",
    historial: [],
    ...parcial,
  };
}

function documento(id: string, gestiones: string[]): DocumentoDemo {
  return { id, identidadId: "ana", titulo: id, tipo: "constancia_ejemplo", fecha: "2026-10-01T10:00:00.000Z", vistaPrevia: [], gestionesRelacionadas: gestiones };
}

describe("gestionesRelacionadas", () => {
  it("incluye sólo gestiones con datos reutilizados o documentos ligados, las más recientes primero", () => {
    const resultado = gestionesRelacionadas(
      [
        gestion({ id: "sin-relacion", actualizadaEn: "2026-10-09T00:00:00.000Z" }),
        gestion({ id: "con-documento", actualizadaEn: "2026-10-02T00:00:00.000Z" }),
        gestion({
          id: "con-datos",
          actualizadaEn: "2026-10-05T00:00:00.000Z",
          camposReutilizados: ["nombreCompleto"],
          datos: { nombreCompleto: "Ana Ek Canché" },
        }),
      ],
      [documento("doc-1", ["con-documento"])],
    );
    expect(resultado.map((relacion) => relacion.gestion.id)).toEqual(["con-datos", "con-documento"]);
    expect(resultado[0]?.reutilizados).toEqual([{ nombre: "nombreCompleto", etiqueta: "Nombre completo", valor: "Ana Ek Canché" }]);
    expect(resultado[1]?.documentos.map((d) => d.id)).toEqual(["doc-1"]);
  });

  it("muestra los valores guardados de forma legible y respeta el máximo", () => {
    const muchas = Array.from({ length: 8 }, (_, indice) =>
      gestion({ id: `g-${indice}`, camposReutilizados: ["correo", "acepta"], datos: { correo: null, acepta: true } }),
    );
    const resultado = gestionesRelacionadas(muchas, [], 3);
    expect(resultado).toHaveLength(3);
    expect(resultado[0]?.reutilizados).toEqual([
      { nombre: "correo", etiqueta: "Correo electrónico", valor: null },
      { nombre: "acepta", etiqueta: "Acepta", valor: "Sí" },
    ]);
  });
});

describe("etiquetaCampo", () => {
  it("usa la etiqueta del expediente o separa el nombre técnico", () => {
    expect(etiquetaCampo("codigoPostal")).toBe("Código postal");
    expect(etiquetaCampo("nombreNegocio")).toBe("Nombre negocio");
    expect(etiquetaCampo("toString")).toBe("To string");
  });
});
