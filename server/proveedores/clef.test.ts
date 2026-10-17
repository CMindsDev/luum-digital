// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type { Registrador, ValorRegistro } from "../registro";
import { crearClienteClef, PAUSA_TRAS_FALLO_MS } from "./clef";

const PREGUNTAS = { solicitada: { type: "noul", instructions: "¿La persona lo pidió?" } } as const;

function respuestaClef(cuerpo: unknown, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status: estado, headers: { "Content-Type": "application/json" } });
}

function registroEnMemoria() {
  const eventos: { evento: string; datos: Readonly<Record<string, ValorRegistro>> }[] = [];
  const registrar: Registrador = (evento, datos = {}) => {
    eventos.push({ evento, datos });
  };
  return { eventos, registrar };
}

describe("cliente Clef", () => {
  it("sin credenciales devuelve null y no llama a la red", async () => {
    const solicitar = vi.fn<typeof fetch>();
    const clef = crearClienteClef({ cuentaId: null, token: null, modelo: "clef", timeoutMs: 1000, fetch: solicitar });
    expect(clef.configurado).toBe(false);
    expect(await clef.decidir("estado", PREGUNTAS)).toBeNull();
    expect(solicitar).not.toHaveBeenCalled();
  });

  it("consulta el endpoint de Workers AI, valida la respuesta y la guarda en caché", async () => {
    const solicitar = vi.fn<typeof fetch>(async () =>
      respuestaClef({ result: { answers: { solicitada: { type: "noul", noul: 0.82 } } } }),
    );
    const clef = crearClienteClef({ cuentaId: "cuentaprueba123", token: "token-prueba-123", modelo: "clef", timeoutMs: 1000, fetch: solicitar });
    const primera = await clef.decidir("Persona: sí, prepáralo", PREGUNTAS);
    const segunda = await clef.decidir("Persona: sí, prepáralo", PREGUNTAS);
    expect(primera).toEqual({ solicitada: { type: "noul", noul: 0.82 } });
    expect(segunda).toEqual(primera);
    expect(solicitar).toHaveBeenCalledTimes(1);
    const [url, init] = solicitar.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://api.cloudflare.com/client/v4/accounts/cuentaprueba123/ai/run/@cf/cloudflare/clef");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ model: "clef", state: "Persona: sí, prepáralo", questions: PREGUNTAS });
  });

  it("ante un fallo devuelve null, pausa el proveedor y nunca registra el estado", async () => {
    let ahora = 1_000;
    const { eventos, registrar } = registroEnMemoria();
    const solicitar = vi.fn<typeof fetch>(async () => respuestaClef({ error: "x" }, 500));
    const clef = crearClienteClef({
      cuentaId: "cuentaprueba123",
      token: "token-prueba-123",
      modelo: "clef",
      timeoutMs: 1000,
      fetch: solicitar,
      registrar,
      ahora: () => ahora,
    });
    expect(await clef.decidir("texto privado de la persona", PREGUNTAS)).toBeNull();
    expect(await clef.decidir("otro texto", PREGUNTAS)).toBeNull();
    expect(solicitar).toHaveBeenCalledTimes(1);
    ahora += PAUSA_TRAS_FALLO_MS + 1;
    await clef.decidir("otro texto", PREGUNTAS);
    expect(solicitar).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(eventos)).not.toContain("texto privado");
    expect(eventos[0]).toEqual({ evento: "clef_no_disponible", datos: { tipo: "http_500", modelo: "clef" } });
  });

  it("rechaza respuestas incompletas o de otro tipo", async () => {
    const solicitar = vi.fn<typeof fetch>(async () =>
      respuestaClef({ result: { answers: { otra: { type: "noul", noul: 0.5 } } } }),
    );
    const clef = crearClienteClef({ cuentaId: "cuentaprueba123", token: "token-prueba-123", modelo: "clef", timeoutMs: 1000, fetch: solicitar });
    expect(await clef.decidir("estado", PREGUNTAS)).toBeNull();
  });

  it("respeta el tiempo máximo", async () => {
    const solicitar = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise<Response>((_resolver, rechazar) => {
          init?.signal?.addEventListener("abort", () => rechazar(init.signal?.reason ?? new Error("abort")));
        }),
    );
    const clef = crearClienteClef({ cuentaId: "cuentaprueba123", token: "token-prueba-123", modelo: "clef", timeoutMs: 20, fetch: solicitar });
    expect(await clef.decidir("estado", PREGUNTAS)).toBeNull();
  });
});
