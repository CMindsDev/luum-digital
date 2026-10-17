import { describe, expect, it } from "vitest";
import type { MensajeConversacion } from "../runtime/store";
import { colaSubtitulo, describirPresencia, resumirLinea, type EntradaPresencia } from "./presencia";

const RESPUESTA: MensajeConversacion = {
  id: "m2",
  rol: "asistente",
  texto: "Listo: abrí «Bache a la vista» con una descripción sugerida. Revísala y envíalo tú.",
  pendiente: false,
  origen: "texto",
};

function entrada(cambios: Partial<EntradaPresencia> = {}): EntradaPresencia {
  return {
    panelAbierto: false,
    estadoSesion: "listo",
    vozActiva: false,
    accionesEnCurso: [],
    avisos: [],
    mensajes: [{ id: "m1", rol: "persona", texto: "Quiero reportar un bache", pendiente: false, origen: "texto" }, RESPUESTA],
    mensajeVisto: null,
    avisoVisto: null,
    ...cambios,
  };
}

describe("describirPresencia", () => {
  it("con el panel abierto sólo queda la mascota", () => {
    expect(describirPresencia(entrada({ panelAbierto: true }))).toBeNull();
  });

  it("una acción en pantalla gana sobre todo lo demás", () => {
    const linea = describirPresencia(
      entrada({
        accionesEnCurso: [{ llamadaId: "c1", accion: "prepararReporte", estadoTexto: "Preparando el reporte…" }],
        avisos: [{ id: "a1", tono: "critico", titulo: "Se cortó la conexión" }],
      }),
    );
    expect(linea).toEqual({ tipo: "accion", texto: "Preparando el reporte…", enLlamada: false });
  });

  it("un aviso se muestra hasta que se marca como visto", () => {
    const avisos = [{ id: "a1", tono: "precaucion" as const, titulo: "Micrófono bloqueado" }];
    expect(describirPresencia(entrada({ avisos }))?.tipo).toBe("aviso");
    expect(describirPresencia(entrada({ avisos, avisoVisto: "a1" }))?.tipo).toBe("respuesta");
  });

  it("la última respuesta sin ver se resume en su primera oración; vista, desaparece", () => {
    expect(describirPresencia(entrada())).toEqual({
      tipo: "respuesta",
      texto: "Listo: abrí «Bache a la vista» con una descripción sugerida.",
      enLlamada: false,
    });
    expect(describirPresencia(entrada({ mensajeVisto: "m2" }))).toBeNull();
    expect(describirPresencia(entrada({ mensajes: [{ ...RESPUESTA, pendiente: true }] }))).toBeNull();
  });

  it("pensando y conectando se dicen con texto, no sólo con la animación", () => {
    expect(describirPresencia(entrada({ estadoSesion: "pensando" }))?.texto).toBe("Pensando…");
    expect(describirPresencia(entrada({ estadoSesion: "conectando" }))?.texto).toBe("Conectando…");
  });

  it("en llamada: «Te escucho» o los subtítulos de lo que dice, y ofrece colgar", () => {
    expect(describirPresencia(entrada({ vozActiva: true, estadoSesion: "escuchando", mensajeVisto: "m2" }))).toEqual({
      tipo: "escuchando",
      texto: "Te escucho",
      enLlamada: true,
    });
    const hablando = describirPresencia(entrada({ vozActiva: true, estadoSesion: "hablando" }));
    expect(hablando?.tipo).toBe("hablando");
    expect(hablando?.enLlamada).toBe(true);
  });
});

describe("textos de la línea", () => {
  it("resumirLinea acota y deja una sola línea", () => {
    expect(resumirLinea("Hola.\nSegunda línea")).toBe("Hola.");
    const largo = resumirLinea("palabra ".repeat(60), 40);
    expect(Array.from(largo).length).toBeLessThanOrEqual(40);
    expect(largo.endsWith("…")).toBe(true);
  });

  it("colaSubtitulo conserva el final de lo que se dice", () => {
    expect(colaSubtitulo("Corto")).toBe("Corto");
    const cola = colaSubtitulo(`${"uno dos tres ".repeat(20)}final del mensaje`, 40);
    expect(cola.startsWith("…")).toBe(true);
    expect(cola.endsWith("final del mensaje")).toBe(true);
  });
});
