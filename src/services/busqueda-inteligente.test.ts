import { describe, expect, it, vi } from "vitest";
import { crearClienteBusquedaInteligente } from "./busqueda-inteligente";

const RESPUESTA_VALIDA = {
  respuesta: "Puedes revisar la ficha [1].",
  generada: true,
  citas: [{ n: 1, titulo: "Ficha", ruta: "/servicios/licencia", fechaConsulta: "2026-10-10" }],
  pasajes: [
    {
      id: "pasaje-1",
      tipo: "servicio",
      titulo: "Ficha",
      texto: "Texto de apoyo para la persona usuaria.",
      fuente: { titulo: "Catálogo", fechaConsulta: "2026-10-10" },
      ruta: "/servicios/licencia",
    },
  ],
  intencion: { categoria: "consulta_tramite", modo: "shadow" },
} as const;

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });
}

describe("crearClienteBusquedaInteligente", () => {
  it("envía la consulta al endpoint del asistente y valida la respuesta", async () => {
    const fetchMock = vi.fn(async () => respuestaJson(RESPUESTA_VALIDA));
    const cliente = crearClienteBusquedaInteligente({ fetch: fetchMock });

    await expect(cliente.buscar("licencia de funcionamiento")).resolves.toEqual(RESPUESTA_VALIDA);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/asistente/busqueda",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      }),
    );
  });

  it("devuelve null si la respuesta no cumple el contrato", async () => {
    const fetchMock = vi.fn(async () => respuestaJson({ respuesta: "sin datos" }));
    const cliente = crearClienteBusquedaInteligente({ fetch: fetchMock });

    await expect(cliente.buscar("licencia de funcionamiento")).resolves.toBeNull();
  });

  it("devuelve null ante errores HTTP o de red", async () => {
    const cliente503 = crearClienteBusquedaInteligente({ fetch: vi.fn(async () => respuestaJson({ error: "No disponible" }, 503)) });
    const clienteRed = crearClienteBusquedaInteligente({ fetch: vi.fn(async () => Promise.reject(new Error("sin red"))) });

    await expect(cliente503.buscar("licencia de funcionamiento")).resolves.toBeNull();
    await expect(clienteRed.buscar("licencia de funcionamiento")).resolves.toBeNull();
  });

  it("degrada si la consulta no cumple el contrato antes de enviarla", async () => {
    const fetchMock = vi.fn(async () => respuestaJson(RESPUESTA_VALIDA));
    const cliente = crearClienteBusquedaInteligente({ fetch: fetchMock });

    await expect(cliente.buscar("a")).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
