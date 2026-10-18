// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ExpertoGeneralSchema } from "../../shared/asistente/expertos";
import { SolicitudConexionSchema } from "../../shared/asistente/servidor";
import type { PantallaActual } from "../../shared/asistente/pantalla";
import { instruccionesDeSesion } from "./sesion-realtime";
import { preguntaPorPreferenciasDelAsistente } from "../conocimiento/alcance";

const PANTALLA: PantallaActual = { ruta: "/", titulo: "Inicio", seccion: "inicio", rol: "ciudadania", objetivos: [], dialogoAbierto: null, formulario: null };

describe("expertos acotados", () => {
  it.each(ExpertoGeneralSchema.options)("%s conserva las fuentes, la confirmación y el rechazo de gustos personales", (experto) => {
    const texto = instruccionesDeSesion("general", PANTALLA, undefined, "es", experto);
    expect(texto).toContain("consultarConocimiento");
    expect(texto).toContain("No sustituye atención humana");
    expect(texto).toContain("comida favorita");
    expect(texto).toContain("la persona revisa y confirma");
  });

  it("no permite abrir el acompañante como un experto del asistente general", () => {
    expect(SolicitudConexionSchema.safeParse({ ambito: "general", sdp: "v=0 abcdefgh", pantalla: PANTALLA, experto: "bienestar" }).success).toBe(false);
    expect(instruccionesDeSesion("bienestar", PANTALLA)).toContain("El acompañante se llama Alma");
  });

  it("catastro y jurídico no obtienen permisos ni datos adicionales", () => {
    expect(instruccionesDeSesion("general", PANTALLA, undefined, "es", "urbano")).toContain("No determines derechos de propiedad");
    expect(instruccionesDeSesion("general", PANTALLA, undefined, "es", "juridico")).toContain("no sustituyas a una persona abogada");
  });

  it.each(["¿Cuál es tu comida favorita?", "Cuál es tu comida favorita en Mérida", "What is your favorite food?", "¿Qué te gusta comer en Mérida?"])("rechaza preferencias explícitas: %s", (consulta) => {
    expect(preguntaPorPreferenciasDelAsistente(consulta)).toBe(true);
  });

  it.each(["Cuál es el costo de la licencia", "Cuántas direcciones hay", "Apoyo para animales", "¿Dónde guardo mis trámites favoritos?"])("no confunde consultas municipales con preferencias personales: %s", (consulta) => {
    expect(preguntaPorPreferenciasDelAsistente(consulta)).toBe(false);
  });
});
