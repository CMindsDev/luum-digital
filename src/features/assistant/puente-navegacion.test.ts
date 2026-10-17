import { describe, expect, it, vi } from "vitest";
import { PuenteNavegacion } from "./puente-navegacion";

describe("PuenteNavegacion", () => {
  it("navega con el navigate vigente y pasa el estado como `state`", () => {
    const puente = new PuenteNavegacion();
    const navigate = vi.fn();
    puente.fijarNavegar(navigate);
    puente.navegar("/reportes/nuevo/bache", { prefill: { tipo: "reporte", categoria: "bache", origen: "asistente" } });
    expect(navigate).toHaveBeenCalledWith("/reportes/nuevo/bache", { state: { prefill: { tipo: "reporte", categoria: "bache", origen: "asistente" } } });
    puente.navegar("/mapa");
    expect(navigate).toHaveBeenLastCalledWith("/mapa", undefined);
  });

  it("recuerda la pantalla que preparó cada acción y la repite sólo si la persona se movió", () => {
    const puente = new PuenteNavegacion();
    const navigate = vi.fn();
    puente.fijarNavegar(navigate);
    puente.fijarAccion("c1");
    puente.navegar("/reportes/nuevo/bache", { prefill: { tipo: "reporte", categoria: "bache", origen: "asistente" } });
    puente.terminarAccion("c1");
    navigate.mockClear();

    expect(puente.repetir("c1", "/reportes/nuevo/bache")).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
    expect(puente.repetir("c1", "/mapa")).toBe(true);
    expect(navigate).toHaveBeenCalledWith("/reportes/nuevo/bache", expect.objectContaining({ state: expect.any(Object) }));
    expect(puente.repetir("desconocida", "/")).toBe(false);
    puente.olvidar();
    expect(puente.repetir("c1", "/")).toBe(false);
  });

  it("sin cliente de guardas devuelve «sin señal» y nunca hace peticiones", async () => {
    const puente = new PuenteNavegacion();
    await expect(puente.guardas.evaluarAccion({ accion: "prepararReporte", argumentos: {}, mensajesRecientes: [] })).resolves.toMatchObject({ decision: "sin_senal", probabilidad: null });
    await expect(puente.guardas.clasificarIntencion("hola")).resolves.toBeNull();
  });
});
