import { describe, expect, it } from "vitest";
import { CAMPOS_PRACTICA, copiadosVigentes, esquemaPractica } from "./practica";

describe("práctica de reutilización", () => {
  it("cada campo de la práctica corresponde a un dato reutilizable del expediente", () => {
    expect(CAMPOS_PRACTICA.map((campo) => [campo.nombre, campo.reutilizable])).toEqual([
      ["nombreCompleto", "nombreCompleto"],
      ["correo", "correo"],
      ["telefono", "telefono"],
    ]);
  });

  it("un dato copiado deja de contar como «de tu expediente» si la persona lo edita", () => {
    const copiados = { nombreCompleto: "Ana Ek Canché", correo: "ana.ek@ejemplo.mx" };
    expect(copiadosVigentes(copiados, { nombreCompleto: "Ana Ek Canché", correo: "otro@ejemplo.mx" })).toEqual(["nombreCompleto"]);
  });

  it("valida con los esquemas del dominio (teléfono ficticio de 10 dígitos con espacios)", () => {
    expect(esquemaPractica.safeParse({ nombreCompleto: "Ana Ek", correo: "ana@ejemplo.mx", telefono: "999 000 0001" }).success).toBe(true);
    const invalido = esquemaPractica.safeParse({ nombreCompleto: "A", correo: "no-es-correo", telefono: "123" });
    expect(invalido.success).toBe(false);
    expect(invalido.error?.issues.map((issue) => issue.path[0])).toEqual(["nombreCompleto", "correo", "telefono"]);
  });
});
