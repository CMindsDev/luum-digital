import { describe, expect, it } from "vitest";
import { consultaDelEstado, destinoDeBusqueda, esConsultaSensible, LARGO_MAXIMO_CONSULTA } from "./destino-busqueda";

describe("destinoDeBusqueda", () => {
  it("las consultas comunes viajan en ?q=", () => {
    expect(destinoDeBusqueda("  Quiero reportar un bache ")).toEqual({ to: "/buscar?q=Quiero%20reportar%20un%20bache" });
  });

  it("sin texto abre la búsqueda vacía", () => {
    expect(destinoDeBusqueda("   ")).toEqual({ to: "/buscar" });
  });

  it("salud mental y violencia no viajan en la URL", () => {
    for (const consulta of ["Busco apoyo psicológico", "me siento con mucha ansiedad", "mi pareja me pega", "me quiero morir"]) {
      expect(esConsultaSensible(consulta)).toBe(true);
      const destino = destinoDeBusqueda(consulta);
      expect(destino.to).toBe("/buscar");
      expect(destino.state).toEqual({ consulta });
    }
  });

  it("recorta consultas demasiado largas", () => {
    const destino = destinoDeBusqueda("bache ".repeat(60));
    expect(decodeURIComponent(destino.to.replace("/buscar?q=", "")).length).toBeLessThanOrEqual(LARGO_MAXIMO_CONSULTA);
  });
});

describe("consultaDelEstado", () => {
  it("lee sólo cadenas válidas", () => {
    expect(consultaDelEstado({ consulta: "hola" })).toBe("hola");
    expect(consultaDelEstado({ consulta: 3 })).toBeNull();
    expect(consultaDelEstado(null)).toBeNull();
    expect(consultaDelEstado("texto")).toBeNull();
  });
});
