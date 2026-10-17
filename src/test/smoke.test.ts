import { describe, expect, it } from "vitest";

describe("entorno de pruebas", () => {
  it("ejecuta Vitest con jsdom", () => {
    expect(typeof document).toBe("object");
  });
});
