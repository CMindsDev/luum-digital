import { describe, expect, it } from "vitest";
import { describirCoincidencias, evaluarFaltantes, generarAsistencia, sugerirCategoria } from "./asistencia";

describe("asistencia simulada del reporte", () => {
  it("sugiere el tipo por palabras de la descripción", () => {
    expect(sugerirCategoria("Hay un hoyo enorme frente a mi casa")).toBe("bache");
    expect(sugerirCategoria("La lámpara del poste no enciende")).toBe("luminaria");
    expect(sugerirCategoria("La coladera está tapada y se encharca")).toBe("desazolve_rejilla");
    expect(sugerirCategoria("El camión de la basura no pasó el martes")).toBe("recoleccion_basura");
    expect(sugerirCategoria("Perro muerto en la orilla")).toBe("animal_muerto");
    expect(sugerirCategoria("Algo raro")).toBeNull();
  });

  it("un bache que se encharca sigue siendo bache", () => {
    expect(sugerirCategoria("Bache que se encharca cuando llueve")).toBe("bache");
  });

  it("arma el resumen con tipo, primera frase y ubicación, y marca el origen como reglas de demostración", () => {
    const asistencia = generarAsistencia({
      categoria: "bache",
      descripcion: "Bache grande en el carril derecho. Los coches frenan de golpe.",
      ubicacion: { referencia: "Calle 60 x 59 y 61", colonia: "Centro", origen: "manual" },
      conCruzamientos: true,
      tieneFoto: true,
    });
    expect(asistencia.origen).toBe("reglas_demo");
    expect(asistencia.categoriaSugerida).toBe("bache");
    expect(asistencia.resumen).toBe("Bache: Bache grande en el carril derecho. Ubicación: Calle 60 x 59 y 61, Centro.");
    expect(asistencia.faltantes).toEqual([]);
  });

  it("señala información faltante por aspecto", () => {
    const faltantes = evaluarFaltantes({ categoria: "bache", descripcion: "Bache", ubicacion: null, tieneFoto: false });
    expect(faltantes.map((f) => f.aspecto)).toEqual(["descripcion", "ubicacion", "foto"]);
    const sinReferencia = evaluarFaltantes({
      categoria: "luminaria",
      descripcion: "La luminaria no prende desde hace días",
      ubicacion: { referencia: "Calle 21", origen: "mapa" },
      tieneFoto: true,
    });
    expect(sinReferencia.map((f) => f.texto)).toEqual([
      "Di en qué parte está: esquina, carril, frente a qué lugar…",
      "Indica la colonia o comisaría: ayuda a encontrar reportes iguales.",
    ]);
  });

  it("nunca afirma que la foto demuestre profundidad, peligrosidad o autenticidad", () => {
    const asistencia = generarAsistencia({
      categoria: "bache",
      descripcion: "Bache muy profundo y peligroso en la esquina",
      ubicacion: { referencia: "Calle 60 x 59", colonia: "Centro", origen: "manual" },
      conCruzamientos: true,
      tieneFoto: true,
    });
    const textos = [asistencia.resumen ?? "", ...asistencia.faltantes].join(" ").toLowerCase();
    expect(textos).not.toMatch(/foto (demuestra|confirma|prueba)|verificad|autentic/);
  });

  it("describe las coincidencias sin inventarlas", () => {
    expect(describirCoincidencias(null)).toMatch(/Revisaremos/);
    expect(describirCoincidencias(0)).toMatch(/No encontramos/);
    expect(describirCoincidencias(1)).toMatch(/1 posible reporte igual/);
    expect(describirCoincidencias(3)).toMatch(/3 posibles reportes iguales/);
  });
});
