import { describe, expect, it } from "vitest";
import { CATEGORIAS } from "@/data/categorias";
import { SERVICIOS } from "@/data/catalogo";
import { buscarEnIndice, indexarServicio } from "@/domain/busqueda";
import { detectarIntencion } from "@/domain/intencion";
import type { AccionSugerida } from "@/types";
import { accionesComplementarias, CONSULTAS_SUGERIDAS, rutaDeAccion, unirAcciones, type TipoIntencion } from "./acciones";

describe("rutaDeAccion", () => {
  it("abre la ficha interna del servicio", () => {
    expect(rutaDeAccion({ tipo: "abrir_servicio", servicioId: "mid-bih-007", etiqueta: "Ver" })).toBe("/servicios/mid-bih-007");
  });

  it("lleva los requisitos a la sección de la ficha", () => {
    expect(rutaDeAccion({ tipo: "mostrar_requisitos", servicioId: "mid-ftm-210", etiqueta: "Requisitos" })).toBe("/servicios/mid-ftm-210#requisitos");
  });

  it("codifica ids con caracteres especiales", () => {
    expect(rutaDeAccion({ tipo: "abrir_servicio", servicioId: "a b/c", etiqueta: "x" })).toBe("/servicios/a%20b%2Fc");
  });

  it("usa la ruta tal cual para formularios, gestiones, mapa y rutas", () => {
    const acciones: AccionSugerida[] = [
      { tipo: "abrir_formulario", ruta: "/reportes/nuevo/bache", etiqueta: "x" },
      { tipo: "consultar_gestion", ruta: "/gestiones", etiqueta: "x" },
      { tipo: "abrir_mapa", ruta: "/mapa?categoria=bache", etiqueta: "x" },
      { tipo: "abrir_ruta", ruta: "/bienestar", etiqueta: "x" },
    ];
    expect(acciones.map(rutaDeAccion)).toEqual(["/reportes/nuevo/bache", "/gestiones", "/mapa?categoria=bache", "/bienestar"]);
  });
});

describe("unirAcciones", () => {
  it("no repite destinos y respeta el máximo", () => {
    const principales: AccionSugerida[] = [
      { tipo: "consultar_gestion", ruta: "/gestiones", etiqueta: "Consultar mis gestiones" },
      { tipo: "abrir_ruta", ruta: "/servicios", etiqueta: "Catálogo" },
    ];
    const extra: AccionSugerida[] = [
      { tipo: "consultar_gestion", ruta: "/gestiones", etiqueta: "Revisar mis gestiones" },
      { tipo: "abrir_ruta", ruta: "/mapa", etiqueta: "Mapa" },
    ];
    expect(unirAcciones(principales, extra).map((a) => a.etiqueta)).toEqual(["Consultar mis gestiones", "Catálogo", "Mapa"]);
    expect(unirAcciones(principales, extra, 2)).toHaveLength(2);
  });

  it("negocio también ofrece revisar las gestiones", () => {
    expect(accionesComplementarias("negocio").map(rutaDeAccion)).toContain("/gestiones");
    expect(accionesComplementarias("general")).toEqual([]);
  });
});

describe("las seis consultas del brief", () => {
  const indice = SERVICIOS.map((servicio) => indexarServicio(servicio, CATEGORIAS));
  const ESPERADO: Record<(typeof CONSULTAS_SUGERIDAS)[number], { intencion: TipoIntencion; ruta: RegExp }> = {
    "Quiero reportar un bache": { intencion: "reportar", ruta: /^\/reportes\/nuevo\/bache$/ },
    "Necesito saber qué documentos pide este trámite": { intencion: "requisitos", ruta: /^\/servicios/ },
    "Quiero consultar mi folio": { intencion: "consultar_folio", ruta: /^\/(reportes\/mis-reportes|gestiones)/ },
    "Busco apoyo psicológico": { intencion: "apoyo_psicologico", ruta: /^\/bienestar\/salud-mental$/ },
    "Quiero revisar un trámite de mi negocio": { intencion: "negocio", ruta: /^\/servicios\/categoria\/negocios$/ },
    "Busco actividades culturales": { intencion: "cultura", ruta: /^\/servicios\/categoria\/cultura$/ },
  };

  it.each(CONSULTAS_SUGERIDAS)("«%s» propone acciones internas útiles", (consulta) => {
    const resultados = buscarEnIndice(consulta, indice, 20);
    const intencion = detectarIntencion(consulta, { resultados });
    const esperado = ESPERADO[consulta]!;
    expect(intencion.intencion).toBe(esperado.intencion);
    const acciones = unirAcciones(intencion.acciones, accionesComplementarias(intencion.intencion));
    expect(acciones.length).toBeGreaterThan(0);
    const rutas = acciones.map(rutaDeAccion);
    // La primera acción es la más útil y todas son rutas internas (nunca sitios externos).
    expect(rutas[0]).toMatch(esperado.ruta);
    for (const ruta of rutas) expect(ruta.startsWith("/")).toBe(true);
  });
});
