import { afterEach, describe, expect, it } from "vitest";
import { createAssistantStore, obtenerStoreAsistente, storeAsistenteBienestar, storeAsistenteGeneral, LIMITES_STORE } from "./store";

afterEach(() => {
  storeAsistenteGeneral.getState().resetear();
  storeAsistenteBienestar.getState().resetear();
});

describe("stores del asistente", () => {
  it("general y bienestar son instancias separadas que nunca comparten mensajes", () => {
    expect(storeAsistenteGeneral).not.toBe(storeAsistenteBienestar);
    expect(obtenerStoreAsistente("general")).toBe(storeAsistenteGeneral);
    expect(obtenerStoreAsistente("bienestar")).toBe(storeAsistenteBienestar);

    storeAsistenteBienestar.getState().agregarMensajePersona("Me siento muy cansada");
    storeAsistenteBienestar.getState().aplicarEvento({ tipo: "texto_final", mensajeId: "b1", texto: "Te leo." });
    expect(storeAsistenteBienestar.getState().mensajes).toHaveLength(2);
    expect(storeAsistenteGeneral.getState().mensajes).toHaveLength(0);
    expect(JSON.stringify(storeAsistenteGeneral.getState())).not.toContain("cansada");
    expect(storeAsistenteGeneral.getState().mensajesRecientes()).toEqual([]);
  });

  it("cada fábrica crea una conversación nueva y resetear la borra por completo", () => {
    const uno = createAssistantStore("bienestar");
    const dos = createAssistantStore("bienestar");
    uno.getState().agregarMensajePersona("Hola");
    uno.getState().agregarAviso({ tono: "info", titulo: "Aviso" });
    uno.getState().establecerModo("demostracion", "Respuestas programadas (demostración)");
    expect(dos.getState().mensajes).toHaveLength(0);
    uno.getState().resetear();
    expect(uno.getState()).toMatchObject({ ambito: "bienestar", mensajes: [], avisos: [], modo: null, estadoSesion: "inactivo" });
  });

  it("no persiste nada en localStorage", () => {
    const antes = window.localStorage.length;
    storeAsistenteGeneral.getState().agregarMensajePersona("Quiero reportar un bache");
    expect(window.localStorage.length).toBe(antes);
    for (let i = 0; i < window.localStorage.length; i += 1) {
      expect(window.localStorage.getItem(window.localStorage.key(i) ?? "")).not.toContain("bache");
    }
  });

  it("aplica deltas, texto final con fuentes, acciones en curso, recibos y avisos", () => {
    const store = createAssistantStore("general");
    const { aplicarEvento } = store.getState();
    aplicarEvento({ tipo: "texto_delta", mensajeId: "m1", texto: "Hola, " });
    aplicarEvento({ tipo: "texto_delta", mensajeId: "m1", texto: "te ayudo." });
    expect(store.getState().mensajes[0]).toMatchObject({ id: "m1", texto: "Hola, te ayudo.", pendiente: true });
    aplicarEvento({ tipo: "texto_final", mensajeId: "m1", texto: "Hola, te ayudo.", fuentes: [{ titulo: "Fuente" }] });
    expect(store.getState().mensajes[0]).toMatchObject({ pendiente: false, fuentes: [{ titulo: "Fuente" }] });

    aplicarEvento({ tipo: "accion", llamada: { llamadaId: "c1", accion: "buscarServicios", argumentos: { consulta: "x" } } });
    expect(store.getState().accionesEnCurso).toEqual([{ llamadaId: "c1", accion: "buscarServicios", estadoTexto: "Buscando en el catálogo…" }]);
    store.getState().registrarRecibo({ llamadaId: "c1", accion: "buscarServicios", estado: "completada", mensaje: "Listo" });
    expect(store.getState().accionesEnCurso).toEqual([]);
    expect(store.getState().recibos).toHaveLength(1);

    for (let i = 0; i < 10; i += 1) aplicarEvento({ tipo: "aviso", aviso: { tono: "info", titulo: `Aviso ${i}` } });
    expect(store.getState().avisos).toHaveLength(LIMITES_STORE.avisos);
    aplicarEvento({ tipo: "aviso", aviso: { tono: "info", titulo: "Aviso 9" } });
    expect(store.getState().avisos.filter((aviso) => aviso.titulo === "Aviso 9")).toHaveLength(1);

    aplicarEvento({ tipo: "nivel_voz", nivel: 3 });
    expect(store.getState().nivelVoz).toBe(1);
    aplicarEvento({ tipo: "estado", estado: "cerrado" });
    expect(store.getState()).toMatchObject({ estadoSesion: "cerrado", vozActiva: false, nivelVoz: 0 });
  });

  it("ancla cada acción a su lugar en el historial para intercalar los recibos", () => {
    const store = createAssistantStore("general");
    store.getState().agregarMensajePersona("Quiero reportar un bache");
    store.getState().aplicarEvento({ tipo: "accion", llamada: { llamadaId: "c1", accion: "prepararReporte", argumentos: { categoria: "bache" } } });
    store.getState().aplicarEvento({ tipo: "texto_final", mensajeId: "m1", texto: "Te dejo el formulario." });
    store.getState().registrarRecibo({ llamadaId: "c1", accion: "prepararReporte", estado: "preparada_para_confirmar", mensaje: "Listo" });
    // Recibo sin inicio visto: se ancla al llegar.
    store.getState().registrarRecibo({ llamadaId: "c2", accion: "navegar", estado: "fallida", mensaje: "No" });
    expect(store.getState().anclasRecibos).toEqual({ c1: 1, c2: 2 });
    store.getState().resetear();
    expect(store.getState().anclasRecibos).toEqual({});
  });

  it("acota los mensajes recientes para la guarda (6 × 400 caracteres)", () => {
    const store = createAssistantStore("general");
    for (let i = 0; i < 10; i += 1) store.getState().agregarMensajePersona(`${i} ${"x".repeat(600)}`);
    const recientes = store.getState().mensajesRecientes();
    expect(recientes).toHaveLength(6);
    expect(recientes.every((mensaje) => mensaje.texto.length <= 400)).toBe(true);
  });
});
