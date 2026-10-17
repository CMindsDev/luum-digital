import { describe, expect, it, vi } from "vitest";
import type { AmbitoAsistente } from "@shared/asistente/acciones";
import type { PantallaActual } from "@shared/asistente/pantalla";
import type { EventoAsistente } from "@/services/contracts";
import { ACTOR, crearRepositorios, LICENCIA, pantallaDe } from "../../runtime/__fixtures__/repositorios";
import { ejecutarAccion, type ContextoEjecucion } from "../../runtime/ejecutor";
import { DemoAssistantProvider } from "./DemoAssistantProvider";
import { detectarRiesgo } from "./texto";

async function conversar(ambito: AmbitoAsistente, frases: readonly string[], pantalla: PantallaActual = pantallaDe()) {
  const sesion = new DemoAssistantProvider({ retrasoMs: 0 }).crearSesion({ ambito, pantalla });
  const eventos: EventoAsistente[] = [];
  const navegar = vi.fn<ContextoEjecucion["navegar"]>();
  const abrirApoyoHumano = vi.fn<NonNullable<ContextoEjecucion["abrirApoyoHumano"]>>();
  const contexto: ContextoEjecucion = { ambito, repositorios: crearRepositorios(), actor: ACTOR, navegar, pantalla, abrirApoyoHumano };
  sesion.suscribir((evento) => {
    eventos.push(evento);
    if (evento.tipo === "accion") void ejecutarAccion(evento.llamada, contexto).then((recibo) => sesion.entregarRecibo(recibo));
  });
  for (const frase of frases) await sesion.enviarTexto(frase);
  const acciones = eventos.flatMap((evento) => (evento.tipo === "accion" ? [evento.llamada] : []));
  const textos = eventos.flatMap((evento) => (evento.tipo === "texto_final" ? [evento.texto] : []));
  const fuentes = eventos.flatMap((evento) => (evento.tipo === "texto_final" ? (evento.fuentes ?? []) : []));
  return { eventos, acciones, textos, fuentes, navegar, abrirApoyoHumano, sesion };
}

/** Índice del primer evento de cada tipo, para comprobar el orden. */
function primero(eventos: EventoAsistente[], tipo: EventoAsistente["tipo"]) {
  return eventos.findIndex((evento) => evento.tipo === tipo);
}

describe("escenarios demo del asistente general: las 6 consultas del brief", () => {
  it("«Quiero reportar un bache» prepara «Bache a la vista» sin enviar", async () => {
    const { acciones, textos, navegar } = await conversar("general", ["Quiero reportar un bache"]);
    expect(acciones.map((llamada) => llamada.accion)).toEqual(["prepararReporte"]);
    expect(navegar).toHaveBeenCalledWith("/reportes/nuevo/bache", {
      prefill: { tipo: "reporte", categoria: "bache", descripcion: "Bache en la vía pública.", origen: "asistente" },
    });
    expect(textos.at(-1)).toMatch(/No se envía nada hasta que confirmes/);
  });

  it("toma la descripción y la referencia escritas por la persona", async () => {
    const { navegar } = await conversar("general", ["Quiero reportar un bache en la calle 60 del Centro"]);
    expect(navegar).toHaveBeenCalledWith("/reportes/nuevo/bache", {
      prefill: {
        tipo: "reporte",
        categoria: "bache",
        descripcion: "Un bache en la calle 60 del Centro.",
        referenciaUbicacion: "calle 60 del Centro",
        origen: "asistente",
      },
    });
  });

  it("«Necesito saber qué documentos pide este trámite» pregunta cuál, busca y muestra requisitos al confirmar", async () => {
    const { acciones, textos, fuentes } = await conversar("general", [
      "Necesito saber qué documentos pide este trámite",
      "licencia de funcionamiento",
      "sí",
    ]);
    expect(textos[0]).toMatch(/¿De qué trámite\?/);
    expect(acciones.map((llamada) => llamada.accion)).toEqual(["buscarServicios", "consultarRequisitos"]);
    expect(acciones[1]?.argumentos).toEqual({ servicioId: LICENCIA.id });
    expect(textos[1]).toMatch(/¿Quieres que te muestre los requisitos de «Licencia de funcionamiento \(prueba\)»\?/);
    expect(textos[2]).toContain("Formato de solicitud de prueba");
    expect(fuentes.some((fuente) => fuente.titulo === LICENCIA.fuenteOficial.nombre)).toBe(true);
  });

  it("si la ficha de un trámite está abierta, «este trámite» es ése", async () => {
    const pantalla = pantallaDe({ ruta: `/servicios/${LICENCIA.id}`, seccion: "servicios" });
    const { acciones } = await conversar("general", ["Necesito saber qué documentos pide este trámite"], pantalla);
    expect(acciones).toEqual([expect.objectContaining({ accion: "consultarRequisitos", argumentos: { servicioId: LICENCIA.id } })]);
  });

  it("«Quiero consultar mi folio» abre Mis reportes y nunca inventa folios", async () => {
    const { acciones, textos, navegar } = await conversar("general", ["Quiero consultar mi folio", "DEMO-R-0000001", "¿Cómo va DEMO-R-7777777?"]);
    expect(acciones.map((llamada) => llamada.argumentos)).toEqual([{}, { folio: "DEMO-R-0000001" }, { folio: "DEMO-R-7777777" }]);
    expect(navegar).toHaveBeenNthCalledWith(1, "/reportes/mis-reportes");
    expect(textos[0]).toMatch(/Si tienes un folio, escríbelo/);
    expect(textos[1]).toMatch(/DEMO-R-0000001.*En proceso de atención/);
    expect(textos[2]).toMatch(/No encontré un reporte con el folio DEMO-R-7777777/);
  });

  it("«Busco apoyo psicológico» muestra ayuda humana y abre Salud mental", async () => {
    const { acciones, navegar, abrirApoyoHumano, textos } = await conversar("general", ["Busco apoyo psicológico"]);
    expect(acciones.map((llamada) => llamada.accion)).toEqual(["mostrarApoyoHumano", "navegar"]);
    expect(abrirApoyoHumano).toHaveBeenCalledWith("salud_mental");
    expect(navegar).toHaveBeenCalledWith("/bienestar/salud-mental");
    expect(textos.at(-1)).toMatch(/Ayuda inmediata/);
  });

  it("«Quiero revisar un trámite de mi negocio» busca la licencia de funcionamiento", async () => {
    const { acciones, textos } = await conversar("general", ["Quiero revisar un trámite de mi negocio"]);
    expect(acciones).toEqual([expect.objectContaining({ accion: "buscarServicios", argumentos: { consulta: "licencia de funcionamiento" } })]);
    expect(textos[0]).toMatch(/Licencia de funcionamiento \(prueba\) \(información verificada\)/);
    expect(textos[0]).toMatch(/Mis gestiones/);
  });

  it("«Busco actividades culturales» busca cultura y reconoce información pendiente", async () => {
    const { acciones, textos } = await conversar("general", ["Busco actividades culturales"]);
    expect(acciones).toEqual([expect.objectContaining({ accion: "buscarServicios", argumentos: { consulta: "cultura" } })]);
    expect(textos[0]).toMatch(/pendiente de verificar/);
  });
});

describe("escenarios demo del asistente general: seguridad y otros", () => {
  it("ante señales de riesgo muestra ayuda humana ANTES de cualquier texto y no prepara nada más", async () => {
    const { eventos, acciones, abrirApoyoHumano } = await conversar("general", ["Ya no quiero vivir, pero quiero reportar un bache"]);
    expect(acciones.map((llamada) => llamada.accion)).toEqual(["mostrarApoyoHumano"]);
    expect(abrirApoyoHumano).toHaveBeenCalledWith("salud_mental");
    expect(primero(eventos, "accion")).toBeLessThan(primero(eventos, "texto_final"));
  });

  it("la lista local de riesgo distingue motivos", () => {
    expect(detectarRiesgo("Me quiero morir")).toBe("salud_mental");
    expect(detectarRiesgo("Mi pareja me golpea")).toBe("violencia");
    expect(detectarRiesgo("¡Auxilio, es una emergencia!")).toBe("emergencia");
    expect(detectarRiesgo("Quiero reportar un bache")).toBeNull();
  });

  it("responde quién es sin tecnicismos y con honestidad", async () => {
    const { textos, acciones } = await conversar("general", ["¿Eres una IA?"]);
    expect(acciones).toEqual([]);
    expect(textos[0]).toMatch(/No soy una persona/);
    expect(textos[0]).toMatch(/asistente virtual/);
    expect(textos[0]).toMatch(/Tú siempre confirmas/);
  });

  it("abre el mapa, explica beneficios, señala controles visibles y responde con sugerencias", async () => {
    const { acciones, textos, navegar } = await conversar("general", [
      "¿Dónde hay baches? Quiero ver el mapa",
      "¿Cuántos puntos tengo para beneficios?",
      "¿Dónde está el buscador?",
      "Cuéntame un chiste",
    ]);
    expect(acciones.map((llamada) => llamada.accion)).toEqual(["abrirMapa", "explicarBeneficiosDemo", "senalarElemento"]);
    expect(acciones[0]?.argumentos).toEqual({ categoria: "bache" });
    expect(navegar).toHaveBeenCalledWith("/participacion/recompensas");
    expect(acciones[2]?.argumentos).toEqual({ objetivo: "inicio.buscador" });
    expect(textos[1]).toMatch(/25 puntos disponibles/);
    expect(textos[1]).toMatch(/no hay descuentos/);
    expect(textos.at(-1)).toMatch(/Quiero reportar un bache/);
  });

  it("es reproducible: la misma conversación produce las mismas respuestas", async () => {
    const frases = ["Hola", "Quiero revisar un trámite de mi negocio", "sí", "Quiero consultar mi folio"];
    const una = await conversar("general", frases);
    const otra = await conversar("general", frases);
    expect(otra.textos).toEqual(una.textos);
    expect(otra.acciones.map((llamada) => [llamada.accion, llamada.argumentos])).toEqual(una.acciones.map((llamada) => [llamada.accion, llamada.argumentos]));
  });
});

describe("escenarios demo de bienestar", () => {
  const DIAGNOSTICO = /diagn[oó]stic(?!os)|trastorno|puntuaci|puntaje|nivel de (ansiedad|depresi)|racha|cuestionario/i;

  it("«Necesito ayuda inmediata» muestra ayuda humana de inmediato, antes de escribir", async () => {
    const { eventos, acciones, abrirApoyoHumano } = await conversar("bienestar", ["Necesito ayuda inmediata"]);
    expect(acciones.map((llamada) => [llamada.accion, llamada.argumentos])).toEqual([["mostrarApoyoHumano", { motivo: "emergencia" }]]);
    expect(abrirApoyoHumano).toHaveBeenCalledWith("emergencia");
    expect(primero(eventos, "accion")).toBeLessThan(primero(eventos, "texto_final"));
  });

  it("«Quiero hablar de cómo me siento» escucha sin diagnosticar ni puntuar", async () => {
    const { acciones, textos } = await conversar("bienestar", ["Quiero hablar de cómo me siento", "Hoy fue un día pesado en el trabajo", "No sé qué hacer"]);
    expect(acciones).toEqual([]);
    expect(textos).toHaveLength(3);
    expect(textos[0]).toMatch(/No soy una persona/);
    expect(textos.join(" ")).not.toMatch(DIAGNOSTICO);
  });

  it("«me siento…» continúa la conversación con un reflejo que ofrece ayuda humana, sin repetir la bienvenida", async () => {
    const { acciones, textos } = await conversar("bienestar", [
      "Quiero hablar de cómo me siento",
      "Me siento muy cansada últimamente",
      "Hoy me siento un poco mejor, pero sigo triste",
    ]);
    expect(acciones).toEqual([]);
    expect(textos).toHaveLength(3);
    const bienvenida = textos[0] ?? "";
    expect(bienvenida).toMatch(/Gracias por darte este espacio/);
    // Ninguna respuesta posterior repite la bienvenida.
    expect(textos.slice(1).some((texto) => /Gracias por darte este espacio/.test(texto))).toBe(false);
    expect(textos[1]).not.toBe(textos[2]);
    for (const texto of textos.slice(1)) expect(texto).toMatch(/ayuda humana/);
    expect(textos.join(" ")).not.toMatch(DIAGNOSTICO);

    // Sin la frase de entrada, «me siento…» también responde con un reflejo y explica quién es.
    const directa = await conversar("bienestar", ["Me siento sola"]);
    expect(directa.textos[0]).not.toMatch(/Gracias por darte este espacio/);
    expect(directa.textos[0]).toMatch(/ayuda humana/);
    expect(directa.textos[0]).toMatch(/No soy una persona/);
  });

  it("«me siento…» con señales de riesgo sigue mostrando ayuda humana primero", async () => {
    const { eventos, acciones } = await conversar("bienestar", ["Quiero hablar de cómo me siento", "Me siento tan mal que ya no puedo más"]);
    expect(acciones.map((llamada) => [llamada.accion, llamada.argumentos])).toEqual([["mostrarApoyoHumano", { motivo: "salud_mental" }]]);
    const indiceAccion = eventos.findIndex((evento) => evento.tipo === "accion");
    const textosDespues = eventos.slice(indiceAccion).filter((evento) => evento.tipo === "texto_final");
    expect(textosDespues).toHaveLength(1);
  });

  it("«Busco apoyo para alguien» orienta y, si la persona acepta, muestra atención", async () => {
    const { acciones, textos } = await conversar("bienestar", ["Busco apoyo para alguien", "sí"]);
    expect(textos[0]).toMatch(/¿Quieres que te muestre dónde hay atención\?/);
    expect(acciones.map((llamada) => [llamada.accion, llamada.argumentos])).toEqual([["mostrarApoyoHumano", { motivo: "orientacion" }]]);
  });

  it("«Quiero encontrar atención» muestra canales verificados y señala si están visibles", async () => {
    const pantalla = pantallaDe({
      ruta: "/bienestar/salud-mental",
      seccion: "salud_mental",
      objetivos: [{ id: "salud_mental.encontrar_atencion", etiqueta: "Dónde hay atención" }],
    });
    const { acciones } = await conversar("bienestar", ["Quiero encontrar atención"], pantalla);
    expect(acciones.map((llamada) => llamada.accion)).toEqual(["mostrarApoyoHumano", "senalarElemento"]);
  });

  it("ante riesgo, ayuda humana primero; nunca usa acciones fuera de su ámbito", async () => {
    const { eventos, acciones } = await conversar("bienestar", ["Me quiero morir", "Tengo 15 años", "¿Eres una persona?", "abre el mapa"]);
    expect(primero(eventos, "accion")).toBeLessThan(primero(eventos, "texto_final"));
    expect(acciones[0]?.argumentos).toEqual({ motivo: "salud_mental" });
    expect(acciones.every((llamada) => llamada.accion === "mostrarApoyoHumano" || llamada.accion === "senalarElemento")).toBe(true);
    const textos = eventos.flatMap((evento) => (evento.tipo === "texto_final" ? [evento.texto] : []));
    expect(textos[1]).toMatch(/personas adultas/);
    expect(textos[2]).toMatch(/No soy una persona/);
  });
});
