import { describe, expect, it } from "vitest";
import { IntegracionNoDisponibleError, type Repositories } from "@/services/contracts";
import { IDENTIDADES_DEMO } from "@/data/identidades";
import { createRepositories } from "@/services/registry";
import { crearRepositoriosHttp } from "./index";

const actor = IDENTIDADES_DEMO[0]!;

describe("integración real sin adaptador disponible", () => {
  it("TODOS los métodos de TODOS los contratos rechazan con IntegracionNoDisponibleError (nunca un éxito ficticio)", async () => {
    const repos: Repositories = crearRepositoriosHttp();
    let comprobados = 0;
    for (const [contrato, repositorio] of Object.entries(repos)) {
      for (const [metodo, funcion] of Object.entries(repositorio as Record<string, (...args: unknown[]) => Promise<unknown>>)) {
        await expect(funcion(actor, actor, actor), `${contrato}.${metodo}`).rejects.toBeInstanceOf(IntegracionNoDisponibleError);
        comprobados += 1;
      }
    }
    expect(comprobados).toBeGreaterThanOrEqual(40);
  });

  it("el error nombra el contrato y aclara que la acción no se realizó", async () => {
    const error = await crearRepositoriosHttp().reports.create({} as never, actor).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(IntegracionNoDisponibleError);
    expect((error as Error).message).toMatch(/ReportRepository\.create/);
    expect((error as Error).message).toMatch(/no se realizó/i);
  });

  it("el registro devuelve adaptadores reales sin implementación en modo «real» y simulados en «demo»", async () => {
    await expect(createRepositories("real").catalog.list()).rejects.toBeInstanceOf(IntegracionNoDisponibleError);
    expect(await createRepositories("demo").catalog.listCategories()).not.toHaveLength(0);
  });
});
