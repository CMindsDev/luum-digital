import { describe, expect, it } from "vitest";
import { contarFiltros, escribirFiltro, hayBusqueda, leerFiltro, lineasTitulo } from "./filtros";
import { leerPrefillTramite } from "./prefill";
import { nombreModulo, rutaEnOtroModulo } from "./modulos";

describe("filtros del catálogo en la URL", () => {
  it("lee sólo valores conocidos y recorta el texto", () => {
    const filtro = leerFiltro(new URLSearchParams("q=  becas  &categoria=empleo&info=verificada&tipo=pago"));
    expect(filtro).toEqual({ texto: "becas", categoria: "empleo", estadoDeInformacion: "verificada", tipoDeRecorrido: "pago" });
  });

  it("ignora categorías, estados y tipos inventados", () => {
    expect(leerFiltro(new URLSearchParams("categoria=secreta&info=oficial&tipo=hackeo"))).toEqual({});
  });

  it("escribe y borra parámetros sin tocar otros", () => {
    const base = new URLSearchParams("q=predial&otro=1");
    const siguiente = escribirFiltro(base, { categoria: "pagos", texto: undefined });
    expect(siguiente.get("categoria")).toBe("pagos");
    expect(siguiente.has("q")).toBe(false);
    expect(siguiente.get("otro")).toBe("1");
  });

  it("cuenta filtros y detecta búsqueda", () => {
    expect(contarFiltros({ categoria: "cultura", tipoDeRecorrido: "cita" })).toBe(2);
    expect(hayBusqueda({})).toBe(false);
    expect(hayBusqueda({ texto: "museo" })).toBe(true);
  });

  it("divide títulos de categoría en dos líneas (sans + serif)", () => {
    expect(lineasTitulo("Pagos y contribuciones")).toEqual(["Pagos y", "contribuciones"]);
    expect(lineasTitulo("Catastro y desarrollo urbano")).toEqual(["Catastro y", "desarrollo urbano"]);
    expect(lineasTitulo("Atención ciudadana")).toEqual(["Atención", "ciudadana"]);
    expect(lineasTitulo("Empleo")).toEqual(["Empleo", null]);
  });
});

describe("prefill del asistente y módulos internos", () => {
  it("sólo acepta el prefill de trámite del mismo servicio", () => {
    const estado = { prefill: { tipo: "tramite", servicioId: "mid-pac-404", origen: "asistente" } };
    expect(leerPrefillTramite(estado, "mid-pac-404")).toEqual({ tipo: "tramite", servicioId: "mid-pac-404", origen: "asistente" });
    expect(leerPrefillTramite(estado, "otro")).toBeNull();
    expect(leerPrefillTramite({ prefill: { tipo: "reporte", categoria: "bache", origen: "asistente" } }, "mid-pac-404")).toBeNull();
    expect(leerPrefillTramite(null, "mid-pac-404")).toBeNull();
  });

  it("nombra el módulo interno de destino", () => {
    expect(nombreModulo("/bienestar/linea-mujer")).toBe("Línea Mujer");
    expect(nombreModulo("/reportes/nuevo/bache")).toBe("Reportes");
    expect(rutaEnOtroModulo("/expediente")).toBe(true);
    expect(rutaEnOtroModulo("/servicios/mid-pac-404/iniciar")).toBe(false);
  });
});
