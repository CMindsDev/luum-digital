import { describe, expect, it } from "vitest";
import { enrutarExperto } from "./expertos-asistente";

describe("router automático por pregunta", () => {
  it.each([
    ["Hola Peekito", "general"],
    ["¿Cuántas direcciones tiene el Ayuntamiento?", "general"],
    ["Quiero consultar catastro y el uso de suelo", "urbano"],
    ["¿Cuánto cuesta la licencia de construcción?", "urbano"],
    ["Necesito reportar un bache", "urbano"],
    ["¿Dónde consulto el reglamento municipal?", "juridico"],
    ["¿Cómo impugno una sanción?", "juridico"],
    ["¿Cuáles son los requisitos para mi trámite?", "tramites"],
    ["¿Cómo pago el predial?", "tramites"],
    ["Quiero solicitar una cita", "tramites"],
    ["No pasó la recolección de basura", "medio_ambiente"],
    ["¿Qué necesito para podar un árbol?", "medio_ambiente"],
    ["Hay una luminaria que no prende", "medio_ambiente"],
    ["Quiero apoyo psicológico", "bienestar"],
    ["Me siento triste y necesito ayuda", "bienestar"],
    ["No quiero vivir", "bienestar"],
    ["¿Dónde encuentro Toj óolal?", "bienestar"],
  ] as const)("%s → %s", (pregunta, esperado) => {
    expect(enrutarExperto(pregunta)).toBe(esperado);
  });

  it("conserva el tema en continuaciones y cambia cuando se pregunta por otro", () => {
    expect(enrutarExperto("¿Y dónde lo encuentro?", "juridico")).toBe("juridico");
    expect(enrutarExperto("¿Y cuánto cuesta?", "urbano")).toBe("urbano");
    expect(enrutarExperto("Ahora quiero pagar predial", "urbano")).toBe("tramites");
    expect(enrutarExperto("Hola", "tramites")).toBe("general");
    expect(enrutarExperto("¿Y cuál es tu comida favorita?", "tramites")).toBe("general");
  });

  it("prioriza ayuda humana sobre palabras de otros temas", () => {
    expect(enrutarExperto("Tengo ansiedad por una sanción legal", "juridico")).toBe("bienestar");
  });
});
