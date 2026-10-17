import { describe, expect, it, vi } from "vitest";
import { crearClienteGuardas } from "./guardas";

describe("cliente de guardas", () => {
  it("sin servidor responde sin señal y no rompe", async () => {
    const fetchFalso = vi.fn<typeof fetch>(async () => {
      throw new TypeError("Failed to fetch");
    });
    const guardas = crearClienteGuardas({ fetch: fetchFalso });
    await expect(guardas.evaluarAccion({ accion: "prepararReporte", argumentos: { categoria: "bache" }, mensajesRecientes: [] })).resolves.toMatchObject({
      decision: "sin_senal",
      probabilidad: null,
    });
    await expect(guardas.clasificarIntencion("hola")).resolves.toBeNull();
  });

  it("sólo consulta acciones de nivel B", async () => {
    const fetchFalso = vi.fn<typeof fetch>(async () => Response.json({ probabilidad: 0.9, decision: "permitir", modo: "shadow", aplica: true }));
    const guardas = crearClienteGuardas({ fetch: fetchFalso });
    const nivelA = await guardas.evaluarAccion({ accion: "navegar", argumentos: { seccion: "mapa" }, mensajesRecientes: [] });
    expect(nivelA).toMatchObject({ aplica: false, decision: "sin_senal" });
    expect(fetchFalso).not.toHaveBeenCalled();

    const nivelB = await guardas.evaluarAccion({
      accion: "prepararReporte",
      argumentos: { categoria: "bache" },
      mensajesRecientes: [{ rol: "persona", texto: "x".repeat(900) }],
    });
    expect(nivelB).toMatchObject({ probabilidad: 0.9, decision: "permitir" });
    const [ruta, init] = fetchFalso.mock.calls[0] ?? [];
    expect(ruta).toBe("/api/asistente/guardas/accion");
    const cuerpo: unknown = JSON.parse(String(init?.body));
    expect(JSON.stringify(cuerpo).includes("x".repeat(401))).toBe(false);
  });

  it("ignora respuestas mal formadas", async () => {
    const guardas = crearClienteGuardas({ fetch: vi.fn<typeof fetch>(async () => Response.json({ decision: "aprobar todo" })) });
    const respuesta = await guardas.evaluarAccion({ accion: "iniciarTramiteDemo", argumentos: { servicioId: "x" }, mensajesRecientes: [] });
    expect(respuesta.decision).toBe("sin_senal");
  });
});
