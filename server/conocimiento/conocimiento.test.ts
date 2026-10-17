// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PasajeSchema, type Pasaje } from "../../shared/asistente/conocimiento";
import { createApp } from "../app";
import { leerConfiguracion } from "../config";
import { construirPasajes, describirFuente, extraerAreas, leerHechos, leerServicios, slugDeAreaCatalogo } from "./ingesta";
import { normalizarRespuesta } from "./respuesta";
import { crearIndiceConocimiento } from "./indice";
import { codificarVectores, DIMENSIONES_EMBEDDING, MODELO_EMBEDDING, normalizarVector } from "./vectores";

const HTML = readFileSync(new URL("../../data/sources/dependencias/dependencias.html", import.meta.url), "utf8");
const SERVICIOS = leerServicios(JSON.parse(readFileSync(new URL("../../src/data/catalogo/servicios.generated.json", import.meta.url), "utf8")));
const HECHOS = leerHechos(JSON.parse(readFileSync(new URL("../../docs/investigacion/2026-10-17/verify-datos-criticos.json", import.meta.url), "utf8")));
const AREAS = extraerAreas(HTML);
const PASAJES = construirPasajes({ areas: AREAS, servicios: SERVICIOS, fechaConsultaDependencias: "2026-10-17", hechos: HECHOS, fechaConsultaHechos: "2026-10-17" });

describe("ingesta de la página de dependencias", () => {
  it("extrae las 27 áreas de la lista oficial con nombres limpios", () => {
    expect(AREAS).toHaveLength(27);
    expect(AREAS[0]).toMatchObject({ slug: "cabildo", tipo: "cabildo" });
    expect(AREAS.map((area) => area.nombre).join(" ")).not.toMatch(/Font Awesome|-->|<|&/);
    expect(new Set(AREAS.map((area) => area.slug)).size).toBe(27);
    expect(AREAS.every((area) => area.url.startsWith("https://merida.gob.mx/municipio/portal/gobierno/"))).toBe(true);
  });

  it("clasifica por tipo con los conteos de la lista publicada", () => {
    const cuenta = (tipo: string) => AREAS.filter((area) => area.tipo === tipo).length;
    expect(cuenta("direccion")).toBe(14);
    expect(cuenta("secretaria")).toBe(4);
    expect(cuenta("unidad")).toBe(4);
    expect(cuenta("instituto_u_organismo")).toBe(3);
    expect(cuenta("presidencia")).toBe(1);
    expect(cuenta("cabildo")).toBe(1);
  });

  it("falla con claridad si la página guardada no es la esperada", () => {
    expect(() => extraerAreas("<html>captcha</html>")).toThrow(/selector de dependencias/);
  });
});

describe("pasajes", () => {
  it("todos cumplen el contrato y llevan fuente", () => {
    for (const pasaje of PASAJES) {
      expect(PasajeSchema.safeParse(pasaje).success).toBe(true);
      expect(pasaje.fuente.titulo.length).toBeGreaterThan(0);
    }
    expect(new Set(PASAJES.map((pasaje) => pasaje.id)).size).toBe(PASAJES.length);
  });

  it("incluye áreas, estructura, servicios y guía de la plataforma", () => {
    const tipos = new Set(PASAJES.map((pasaje) => pasaje.tipo));
    expect([...tipos].sort()).toEqual(["dato", "dependencia", "estructura", "plataforma", "servicio"]);
    expect(PASAJES.filter((pasaje) => pasaje.tipo === "servicio")).toHaveLength(SERVICIOS.length);
  });

  it("los conteos ya vienen hechos y citan el portal oficial", () => {
    const resumen = PASAJES.find((pasaje) => pasaje.id === "estructura:resumen");
    expect(resumen?.texto).toContain("27 áreas");
    expect(resumen?.texto).toContain("Direcciones: 14");
    const direcciones = PASAJES.find((pasaje) => pasaje.id === "estructura:direccion");
    expect(direcciones?.texto).toContain("14 direcciones");
    expect(direcciones?.fuente.url).toBe("https://merida.gob.mx/municipio/portal/gobierno/dependencias.php");
  });

  it("el resumen aclara las dos cifras: 14 con «Dirección» y 25 áreas sin Cabildo ni Presidencia", () => {
    const resumen = PASAJES.find((pasaje) => pasaje.id === "estructura:resumen");
    expect(resumen?.texto).toContain("son 25 áreas");
    expect(PASAJES.find((pasaje) => pasaje.id === "estructura:direccion")?.texto).toContain("25 áreas sin contar el Cabildo ni la Presidencia");
  });

  it("los datos verificados sólo incluyen lo confirmado, sin jerga técnica y con fuente y cita", () => {
    const datos = PASAJES.filter((pasaje) => pasaje.tipo === "dato");
    expect(datos.length).toBeGreaterThan(100);
    expect(datos.every((pasaje) => pasaje.fuente.url?.startsWith("http"))).toBe(true);
    expect(datos.some((pasaje) => /\bWMS\b|proxy|rastreo/i.test(pasaje.titulo))).toBe(false);
    const emergencias = datos.find((pasaje) => pasaje.titulo.startsWith("Teléfonos de emergencia"));
    expect(emergencias?.texto).toContain("911");
    expect(emergencias?.texto).toContain("Texto publicado en la fuente");
  });

  it("describe la fuente y avisa de las copias archivadas", () => {
    expect(describirFuente("https://portalciudadano.merida.gob.mx/TramitesEnLinea/detalle-tramite/397")).toMatchObject({ titulo: "Portal Ciudadano (MIDigital)" });
    const archivada = describirFuente("https://web.archive.org/web/20260425005233/https://merida.gob.mx/reporta/index.php (original https://merida.gob.mx/reporta/)");
    expect(archivada.titulo).toBe("Portal del Ayuntamiento de Mérida (copia archivada del 2026-04-25)");
    expect(describirFuente("sin enlace").url).toBeUndefined();
  });

  it("no inventa: un servicio con datos pendientes lo dice", () => {
    const pendiente = PASAJES.find((pasaje) => pasaje.tipo === "servicio" && pasaje.texto.includes("pendientes de verificar"));
    expect(pendiente).toBeDefined();
  });

  it("enlaza el área del catálogo con la lista oficial", () => {
    expect(slugDeAreaCatalogo("Catastro · Procesos")).toBe("catastro");
    expect(slugDeAreaCatalogo("Servilimpia")).toBeNull();
  });
});

describe("normalizarRespuesta (citas)", () => {
  const dos: Pasaje[] = [
    { id: "a", tipo: "dato", titulo: "Teléfono", texto: "t", fuente: { titulo: "Portal", url: "https://x.test/a", fechaConsulta: "2026-10-17" } },
    { id: "b", tipo: "dato", titulo: "Horario", texto: "t", fuente: { titulo: "Portal", url: "https://x.test/b" } },
    { id: "c", tipo: "estructura", titulo: "Resumen", texto: "t", fuente: { titulo: "Portal", url: "https://x.test/a" } },
  ];

  it("renumera en orden de aparición y descarta marcadores inexistentes", () => {
    const resultado = normalizarRespuesta("El horario es de 8 a 3 [2]. El teléfono es 911 [1][9].", dos);
    expect(resultado?.texto).toBe("El horario es de 8 a 3 [1]. El teléfono es 911 [2].");
    expect(resultado?.citas.map((cita) => cita.n)).toEqual([1, 2]);
    expect(resultado?.citas[0]?.titulo).toContain("Horario");
  });

  it("junta pasajes de una misma fuente en una sola cita", () => {
    const resultado = normalizarRespuesta("Son 14 [1][3].", [dos[2] as Pasaje, dos[2] as Pasaje, dos[2] as Pasaje]);
    expect(resultado?.texto).toBe("Son 14 [1].");
    expect(resultado?.citas).toHaveLength(1);
  });

  it("sin citas reales o sin información no hay respuesta", () => {
    expect(normalizarRespuesta("Es 911.", dos)).toBeNull();
    expect(normalizarRespuesta("Es 911 [7].", dos)).toBeNull();
    expect(normalizarRespuesta("SIN_INFORMACION", dos)).toBeNull();
  });
});

describe("índice de conocimiento (sólo palabras)", () => {
  const indice = crearIndiceConocimiento({ pasajes: PASAJES });

  it("responde cuántas direcciones hay con el pasaje de estructura primero", async () => {
    const respuesta = await indice.buscar("¿Cuántas direcciones hay en el Ayuntamiento de Mérida?");
    expect(respuesta.metodo).toBe("lexico");
    expect(respuesta.pasajes[0]?.id).toBe("estructura:direccion");
  });

  it("encuentra una dependencia por su nombre", async () => {
    const respuesta = await indice.buscar("qué es el IMPLAN");
    expect(respuesta.pasajes[0]?.id).toBe("dependencia:implan");
  });

  it("encuentra un trámite por palabras", async () => {
    const respuesta = await indice.buscar("cuánto cuesta la matanza de ganado");
    expect(respuesta.pasajes[0]?.id).toBe("servicio:mid-abm-001");
  });

  it("no devuelve nada para preguntas fuera del alcance", async () => {
    for (const fuera of ["cuál es la capital de Francia", "dame una receta de cochinita pibil", "quién ganó el mundial"]) {
      expect((await indice.buscar(fuera)).pasajes).toEqual([]);
    }
  });
});

describe("índice de conocimiento (híbrido)", () => {
  const pasajes: Pasaje[] = [
    { id: "a", tipo: "plataforma", titulo: "Alfa", texto: "Texto alfa sobre reportes", fuente: { titulo: "Guía" } },
    { id: "b", tipo: "plataforma", titulo: "Beta", texto: "Texto beta sobre mapas", fuente: { titulo: "Guía" } },
  ];
  const base = (valores: number[]) => normalizarVector(Float32Array.from([...valores, ...new Array(DIMENSIONES_EMBEDDING - valores.length).fill(0)]));
  const vectores = { modelo: MODELO_EMBEDDING, dimensiones: DIMENSIONES_EMBEDDING, ids: ["a", "b"], datos: codificarVectores([base([1, 0]), base([0, 1])]) };

  it("usa los vectores cuando el embedder responde y supera el umbral", async () => {
    const indice = crearIndiceConocimiento({ pasajes, vectores, embedder: async () => [base([0, 1])] });
    const respuesta = await indice.buscar("consulta sin palabras en común");
    expect(respuesta.metodo).toBe("hibrido");
    expect(respuesta.pasajes.map((pasaje) => pasaje.id)).toEqual(["b"]);
  });

  it("si el embedder falla cae a palabras sin romperse", async () => {
    const indice = crearIndiceConocimiento({
      pasajes: PASAJES,
      vectores: { ...vectores, ids: PASAJES.map((pasaje) => pasaje.id), datos: codificarVectores(PASAJES.map(() => base([1]))) },
      embedder: async () => {
        throw new Error("embeddings_500");
      },
    });
    const respuesta = await indice.buscar("cuántas direcciones hay");
    expect(respuesta.metodo).toBe("lexico");
    expect(respuesta.pasajes[0]?.id).toBe("estructura:direccion");
  });
});

describe("POST /api/asistente/conocimiento", () => {
  const ORIGEN = "http://localhost:5173";
  const app = createApp(leerConfiguracion({}).config, { conocimiento: crearIndiceConocimiento({ pasajes: PASAJES }), registrar: () => undefined });
  const post = (cuerpo: unknown) =>
    app.request("/api/asistente/conocimiento", { method: "POST", headers: { "Content-Type": "application/json", Origin: ORIGEN }, body: JSON.stringify(cuerpo) });

  it("devuelve pasajes con fuente", async () => {
    const respuesta = await post({ consulta: "cuántas secretarías tiene el ayuntamiento" });
    expect(respuesta.status).toBe(200);
    const cuerpo = (await respuesta.json()) as { pasajes: Pasaje[] };
    expect(cuerpo.pasajes[0]?.id).toBe("estructura:secretaria");
    expect(cuerpo.pasajes[0]?.fuente.url).toContain("merida.gob.mx");
  });

  it("rechaza consultas inválidas", async () => {
    expect((await post({ consulta: "a" })).status).toBe(400);
    expect((await post({})).status).toBe(400);
    expect((await post({ consulta: "x".repeat(300) })).status).toBe(400);
  });

  it("rechaza orígenes no permitidos", async () => {
    const respuesta = await app.request("/api/asistente/conocimiento", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://otro.example" },
      body: JSON.stringify({ consulta: "catastro" }),
    });
    expect(respuesta.status).toBe(403);
  });
});

describe("POST /api/asistente/busqueda", () => {
  const ORIGEN = "http://localhost:5173";
  const indice = crearIndiceConocimiento({ pasajes: PASAJES });
  const crear = (redactor: Parameters<typeof createApp>[1] extends infer D ? (D extends { redactor?: infer R } ? R : never) : never) =>
    createApp(leerConfiguracion({}).config, { conocimiento: indice, redactor, registrar: () => undefined });
  const post = (app: ReturnType<typeof crear>, cuerpo: unknown) =>
    app.request("/api/asistente/busqueda", { method: "POST", headers: { "Content-Type": "application/json", Origin: ORIGEN }, body: JSON.stringify(cuerpo) });

  it("devuelve la respuesta citada del redactor y los pasajes relacionados", async () => {
    const app = crear(async () => ({ texto: "Hay 14 direcciones [1].", citas: [{ n: 1, titulo: "Portal", url: "https://merida.gob.mx/x", fechaConsulta: "2026-10-17" }] }));
    const respuesta = await post(app, { consulta: "cuántas direcciones hay" });
    expect(respuesta.status).toBe(200);
    const cuerpo = (await respuesta.json()) as { respuesta: string; generada: boolean; citas: unknown[]; pasajes: Pasaje[] };
    expect(cuerpo).toMatchObject({ respuesta: "Hay 14 direcciones [1].", generada: true });
    expect(cuerpo.citas).toHaveLength(1);
    expect(cuerpo.pasajes.length).toBeGreaterThan(0);
    expect(cuerpo.pasajes.length).toBeLessThanOrEqual(3);
  });

  it("sin IA configurada responde sólo con pasajes (sin inventar redacción)", async () => {
    const respuesta = await post(crear(null), { consulta: "cuántas direcciones hay" });
    const cuerpo = (await respuesta.json()) as { respuesta: string | null; generada: boolean; pasajes: Pasaje[]; intencion: { categoria: string | null } };
    expect(cuerpo.respuesta).toBeNull();
    expect(cuerpo.generada).toBe(false);
    expect(cuerpo.pasajes[0]?.id).toBe("estructura:direccion");
    expect(cuerpo.intencion.categoria).toBeNull();
  });

  it("si el redactor falla no rompe la búsqueda", async () => {
    const app = crear(async () => {
      throw new Error("respuesta_500");
    });
    const respuesta = await post(app, { consulta: "qué es el IMPLAN" });
    expect(respuesta.status).toBe(200);
    expect(((await respuesta.json()) as { generada: boolean }).generada).toBe(false);
  });

  it("rechaza consultas inválidas", async () => {
    const app = crear(null);
    expect((await post(app, { consulta: "a" })).status).toBe(400);
    expect((await post(app, { consulta: "x".repeat(200) })).status).toBe(400);
  });
});
