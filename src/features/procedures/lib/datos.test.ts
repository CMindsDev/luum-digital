import { describe, expect, it } from "vitest";
import type { Gestion } from "@/types";
import { etiquetaDato, referenciaPago, textoDato } from "./datos";
import { agruparPorEstado, sePuedeCancelar } from "./estados";

function gestion(parcial: Partial<Gestion>): Gestion {
  return {
    id: "ges-x",
    folio: null,
    servicioId: "mid-pac-404",
    servicioNombre: "Servicio de ejemplo",
    identidadId: "ana",
    tipo: "formulario",
    estado: "borrador",
    datos: {},
    camposReutilizados: [],
    creadaEn: "2026-10-17T10:00:00.000Z",
    actualizadaEn: "2026-10-17T10:00:00.000Z",
    historial: [],
    ...parcial,
  };
}

describe("detalle de la gestión", () => {
  it("toma la referencia de pago más reciente del historial", () => {
    const g = gestion({
      historial: [
        { fecha: "2026-10-17T10:00:00Z", estado: "borrador", descripcion: "Pago simulado rechazado (DEMO-P-0000001).", actor: "sistema_demo" },
        { fecha: "2026-10-17T10:05:00Z", estado: "borrador", descripcion: "Pago simulado aprobado (DEMO-P-0000002).", actor: "sistema_demo" },
      ],
    });
    expect(referenciaPago(g)).toEqual({ referencia: "DEMO-P-0000002", aprobado: true });
    expect(referenciaPago(gestion({}))).toBeNull();
  });

  it("etiqueta datos conocidos y humaniza los desconocidos", () => {
    expect(etiquetaDato("nombreCompleto")).toBe("Nombre completo");
    expect(etiquetaDato("referenciaCita")).toBe("Referencia de la solicitud de cita");
    expect(etiquetaDato("campoNuevoRaro")).toBe("Campo nuevo raro");
    expect(textoDato(true)).toBe("Sí");
    expect(textoDato(null)).toBe("Sin capturar");
  });

  it("agrupa por estado poniendo primero lo que pide acción", () => {
    const grupos = agruparPorEstado([
      gestion({ id: "a", estado: "resuelta" }),
      gestion({ id: "b", estado: "borrador" }),
      gestion({ id: "c", estado: "requiere_informacion" }),
    ]);
    expect(grupos.map((g) => g.estado)).toEqual(["requiere_informacion", "borrador", "resuelta"]);
  });

  it("no se cancela lo resuelto ni lo ya cancelado", () => {
    expect(sePuedeCancelar({ estado: "en_revision" })).toBe(true);
    expect(sePuedeCancelar({ estado: "resuelta" })).toBe(false);
    expect(sePuedeCancelar({ estado: "cancelada" })).toBe(false);
  });
});
