import { beforeEach, describe, expect, it } from "vitest";
import { crearContextoDemo } from "./storage";
import { crearReportesDemo } from "./reports";
import type { IdentidadDemo } from "@/types";
const admin: IdentidadDemo = { id: "admin", nombre: "Admin demo", iniciales: "AD", rol: "administracion", descripcion: "Demo" };
const ciudadano: IdentidadDemo = { ...admin, id: "ana", rol: "ciudadania" };
function preparar() {
  const contexto = crearContextoDemo({ controles: () => ({ latenciaMs: 0, sinConexion: false, forzarErrorEn: "ninguno" }) });
  return { contexto, repos: crearReportesDemo(contexto) };
}
beforeEach(() => localStorage.clear());
describe("Seguimiento operativo", () => {
  it("persiste equipo e historial sin cambiar estado, verificación ni puntos", async () => {
    const { contexto, repos } = preparar();
    const antes = (await repos.list()).find(r => r.estadoMunicipal === "registrado")!;
    const puntos = contexto.almacen.leer("movimientos");
    await repos.followUp(antes.id, "asignado", "Cuadrilla demo", admin);
    const despues = await crearReportesDemo(contexto).get(antes.id);
    expect(despues?.equipoAsignado).toBe("Cuadrilla demo");
    expect(despues?.estadoMunicipal).toBe(antes.estadoMunicipal);
    expect(despues?.verificacion).toBe(antes.verificacion);
    expect(despues?.historial.at(-1)?.tipo).toBe("asignado");
    expect(contexto.almacen.leer("movimientos")).toEqual(puntos);
  });
  it("impide que ciudadanía asigne y rechaza asignaciones de casos cerrados", async () => {
    const { repos } = preparar(); const lista = await repos.list();
    const abierto = lista.find(r => r.estadoMunicipal === "registrado")!;
    const cerrado = lista.find(r => r.estadoMunicipal === "solucionado")!;
    await expect(repos.followUp(abierto.id, "asignado", "Cuadrilla demo", ciudadano)).rejects.toThrow();
    await expect(repos.followUp(cerrado.id, "asignado", "Cuadrilla demo", admin)).rejects.toThrow();
  });
  it("registra contacto explícitamente simulado y valida el contenido", async () => {
    const { repos } = preparar(); const reporte = (await repos.list())[0]!;
    await expect(repos.followUp(reporte.id, "contacto_simulado", "  ", admin)).rejects.toThrow();
    const resultado = await repos.followUp(reporte.id, "contacto_simulado", "La cuadrilla revisará el caso", admin);
    expect(resultado.historial.at(-1)?.descripcion).toContain("sin envío");
    expect(resultado.estadoMunicipal).toBe(reporte.estadoMunicipal);
  });
});
