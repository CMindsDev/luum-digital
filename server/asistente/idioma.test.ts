// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { PantallaActual } from "../../shared/asistente/pantalla";
import { SolicitudBusquedaSchema } from "../../shared/asistente/busqueda";
import { normalizarRespuesta } from "../conocimiento/respuesta";
import { armarSesionRealtime, instruccionesDeSesion } from "./sesion-realtime";

const PANTALLA: PantallaActual = { ruta: "/", titulo: "Inicio", seccion: "inicio", rol: "ciudadania", objetivos: [], dialogoAbierto: null, formulario: null };

describe("idioma maya del asistente", () => {
  it("en español no agrega la cláusula de maya", () => {
    expect(instruccionesDeSesion("general", PANTALLA)).not.toContain("maya yucateco");
    expect(instruccionesDeSesion("general", PANTALLA, undefined, "es")).not.toContain("Maaya t'aan");
  });

  it("en maya agrega la cláusula, conserva alcance y seguridad y no inventa palabras", () => {
    const texto = instruccionesDeSesion("general", PANTALLA, undefined, "yua");
    expect(texto).toContain("Responde SIEMPRE en maya yucateco");
    expect(texto).toContain("Nunca inventes palabras en maya");
    expect(texto).toContain("mostrarApoyoHumano");
    expect(texto).toContain("Fuente:");
  });

  it("la transcripción no fija idioma en maya (yua no es un código admitido) y sí en español", () => {
    const maya = armarSesionRealtime({ ambito: "general", pantalla: PANTALLA, modelo: "m", voz: "v", idioma: "yua" });
    const es = armarSesionRealtime({ ambito: "general", pantalla: PANTALLA, modelo: "m", voz: "v" });
    const entrada = (sesion: Record<string, unknown>) => (sesion.audio as { input: { transcription: Record<string, unknown> } }).input.transcription;
    expect(entrada(maya)).toEqual({ model: "gpt-4o-mini-transcribe" });
    expect(entrada(es)).toEqual({ model: "gpt-4o-mini-transcribe", language: "es" });
  });

  it("la búsqueda acepta el idioma y rechaza otros", () => {
    expect(SolicitudBusquedaSchema.safeParse({ consulta: "catastro", idioma: "yua" }).success).toBe(true);
    expect(SolicitudBusquedaSchema.safeParse({ consulta: "catastro" }).success).toBe(true);
    expect(SolicitudBusquedaSchema.safeParse({ consulta: "catastro", idioma: "fr" }).success).toBe(false);
  });

  it("las citas de una respuesta en maya se validan igual", () => {
    const pasajes = [{ id: "a", tipo: "dato" as const, titulo: "Teléfono", texto: "t", fuente: { titulo: "Portal", url: "https://x.test" } }];
    expect(normalizarRespuesta("Ba'ax le 911 [1]", pasajes)?.citas).toHaveLength(1);
    expect(normalizarRespuesta("Ba'ax le 911", pasajes)).toBeNull();
  });
});
