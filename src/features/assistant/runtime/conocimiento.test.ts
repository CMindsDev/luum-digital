import { describe, expect, it, vi } from "vitest";
import type { RespuestaConocimiento } from "@shared/asistente/conocimiento";
import { ACTOR, crearRepositorios, pantallaDe } from "./__fixtures__/repositorios";
import { suscribirActuacion } from "./acting-bus";
import { crearClienteConocimiento, type ClienteConocimiento } from "./conocimiento";
import { ejecutarAccion, fuentesDeRecibo, type ContextoEjecucion } from "./ejecutor";

const RESPUESTA: RespuestaConocimiento = {
  metodo: "hibrido",
  pasajes: [
    {
      id: "estructura:direccion",
      tipo: "estructura",
      titulo: "Direcciones del Ayuntamiento de Mérida (14)",
      texto: "El Ayuntamiento de Mérida tiene 14 direcciones en la lista oficial.",
      fuente: { titulo: "Portal del Ayuntamiento de Mérida · Dependencias Municipales", url: "https://merida.gob.mx/municipio/portal/gobierno/dependencias.php", fechaConsulta: "2026-10-17" },
    },
  ],
};

function contexto(conocimiento?: ClienteConocimiento) {
  const navegar = vi.fn<ContextoEjecucion["navegar"]>();
  const ctx: ContextoEjecucion = { ambito: "general", repositorios: crearRepositorios(), actor: ACTOR, navegar, pantalla: pantallaDe(), ...(conocimiento ? { conocimiento } : {}) };
  return { ctx, navegar };
}

const llamada = (consulta: unknown) => ({ llamadaId: "c1", accion: "consultarConocimiento" as const, argumentos: { consulta } });

describe("consultarConocimiento", () => {
  it("devuelve los pasajes con su fuente y no navega ni toca la pantalla", async () => {
    const eventos: string[] = [];
    const dejar = suscribirActuacion((evento) => eventos.push(evento.tipo));
    const { ctx, navegar } = contexto({ buscar: async () => RESPUESTA });
    const recibo = await ejecutarAccion(llamada("cuántas direcciones hay"), ctx);
    dejar();
    expect(recibo.estado).toBe("completada");
    expect(navegar).not.toHaveBeenCalled();
    expect(eventos).toEqual([]);
    expect(JSON.stringify(recibo.datos)).toContain("14 direcciones");
    expect(fuentesDeRecibo(recibo)).toEqual([
      { titulo: "Portal del Ayuntamiento de Mérida · Dependencias Municipales", url: "https://merida.gob.mx/municipio/portal/gobierno/dependencias.php", fechaConsulta: "2026-10-17" },
    ]);
  });

  it("sin pasajes dice que no hay información y pide no inventar", async () => {
    const { ctx } = contexto({ buscar: async () => ({ metodo: "lexico", pasajes: [] }) });
    const recibo = await ejecutarAccion(llamada("capital de Francia"), ctx);
    expect(recibo.estado).toBe("completada");
    expect(recibo.mensaje).toMatch(/No encontré información/);
    expect(JSON.stringify(recibo.datos)).toMatch(/no la tienes/);
  });

  it("si el servicio no responde, falla con un mensaje legible (nunca inventa)", async () => {
    for (const cliente of [undefined, { buscar: async () => null }]) {
      const { ctx } = contexto(cliente);
      const recibo = await ejecutarAccion(llamada("catastro"), ctx);
      expect(recibo.estado).toBe("fallida");
      expect(recibo.mensaje).toMatch(/No pude consultar/);
    }
  });

  it("valida la consulta", async () => {
    const { ctx } = contexto({ buscar: async () => RESPUESTA });
    expect((await ejecutarAccion(llamada("a"), ctx)).estado).toBe("fallida");
  });

  it("no está disponible en bienestar", async () => {
    const { ctx } = contexto({ buscar: async () => RESPUESTA });
    const recibo = await ejecutarAccion(llamada("catastro"), { ...ctx, ambito: "bienestar" });
    expect(recibo.estado).toBe("fallida");
  });
});

describe("crearClienteConocimiento", () => {
  it("envía la consulta recortada y valida la respuesta", async () => {
    const solicitar = vi.fn<typeof fetch>(async () => Response.json(RESPUESTA));
    const cliente = crearClienteConocimiento({ fetch: solicitar });
    expect(await cliente.buscar("  catastro  ")).toEqual(RESPUESTA);
    expect(solicitar.mock.calls[0]?.[0]).toBe("/api/asistente/conocimiento");
    expect(JSON.parse(String(solicitar.mock.calls[0]?.[1]?.body))).toEqual({ consulta: "catastro" });
  });

  it("devuelve null ante errores o respuestas inválidas", async () => {
    expect(await crearClienteConocimiento({ fetch: async () => new Response("x", { status: 503 }) }).buscar("catastro")).toBeNull();
    expect(await crearClienteConocimiento({ fetch: async () => Response.json({ nada: true }) }).buscar("catastro")).toBeNull();
    expect(
      await crearClienteConocimiento({
        fetch: async () => {
          throw new Error("red");
        },
      }).buscar("catastro"),
    ).toBeNull();
  });
});
