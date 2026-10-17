import { describe, expect, it } from "vitest";
import type { CampoEscenario } from "@/components/catalogo/datos-demo";
import { textoCosto } from "@/components/catalogo";
import {
  aDatosGestion,
  camposParaReutilizar,
  fechaMinimaCita,
  reutilizadosVigentes,
  valorParaMostrar,
  valoresIniciales,
} from "./valores";

const CAMPOS: CampoEscenario[] = [
  { nombre: "nombreCompleto", etiqueta: "Nombre completo", tipo: "texto", reutilizable: "nombreCompleto" },
  { nombre: "correo", etiqueta: "Correo", tipo: "correo", reutilizable: "correo" },
  { nombre: "codigoPostal", etiqueta: "Código postal", tipo: "texto", reutilizable: "codigoPostal" },
  {
    nombre: "giro",
    etiqueta: "Giro",
    tipo: "seleccion",
    opciones: [
      { valor: "cafeteria", etiqueta: "Cafetería (ejemplo)" },
      { valor: "otro", etiqueta: "Otro giro (ejemplo)" },
    ],
  },
  { nombre: "superficie", etiqueta: "Superficie", tipo: "numero" },
  { nombre: "entiendoSimulacion", etiqueta: "Entiendo", tipo: "casilla" },
];

describe("valores de formularios simulados", () => {
  it("inicia vacío o con los datos del borrador, nunca con datos inventados", () => {
    expect(valoresIniciales(CAMPOS)).toEqual({ nombreCompleto: "", correo: "", codigoPostal: "", giro: "", superficie: "", entiendoSimulacion: false });
    expect(valoresIniciales(CAMPOS, { giro: "cafeteria", superficie: 40, entiendoSimulacion: true, ajeno: "x" })).toMatchObject({
      giro: "cafeteria",
      superficie: "40",
      entiendoSimulacion: true,
    });
  });

  it("convierte a Gestion.datos sólo con los campos del escenario", () => {
    const datos = aDatosGestion({ nombreCompleto: "  Ana Ek  ", correo: "", superficie: 35, entiendoSimulacion: true, curp: "NO" }, CAMPOS);
    expect(datos).toEqual({ nombreCompleto: "Ana Ek", correo: null, codigoPostal: null, giro: null, superficie: 35, entiendoSimulacion: true });
    expect(datos).not.toHaveProperty("curp");
  });

  it("empareja campos reutilizables con el expediente y marca los que faltan", () => {
    const opciones = camposParaReutilizar(CAMPOS, [
      { campo: "nombreCompleto", etiqueta: "Nombre", valor: "Ana Ek Canché" },
      { campo: "correo", etiqueta: "Correo", valor: "" },
    ]);
    expect(opciones.map((o) => [o.campo.nombre, o.dato?.valor ?? null])).toEqual([
      ["nombreCompleto", "Ana Ek Canché"],
      ["correo", null],
      ["codigoPostal", null],
    ]);
  });

  it("un dato copiado deja de contar como reutilizado si la persona lo edita", () => {
    const copiados = { nombreCompleto: "Ana Ek Canché", correo: "ana@ejemplo.mx" };
    expect(reutilizadosVigentes(copiados, { nombreCompleto: "Ana Ek Canché", correo: "otra@ejemplo.mx" })).toEqual(["nombreCompleto"]);
  });

  it("muestra valores legibles", () => {
    expect(valorParaMostrar(CAMPOS[3]!, "cafeteria")).toBe("Cafetería (ejemplo)");
    expect(valorParaMostrar(CAMPOS[5]!, true)).toBe("Sí");
    expect(valorParaMostrar(CAMPOS[0]!, "")).toBe("Sin capturar");
    expect(valorParaMostrar({ tipo: "fecha" }, "2026-10-20")).toContain("20 de octubre de 2026");
  });

  it("la fecha mínima de una cita simulada es mañana", () => {
    expect(fechaMinimaCita(new Date(2026, 9, 17, 10))).toBe("2026-10-18");
    expect(fechaMinimaCita(new Date(2026, 11, 31, 23))).toBe("2027-01-01");
  });
});

describe("costo de la ficha", () => {
  it("nunca inventa montos", () => {
    expect(textoCosto(undefined)).toBeNull();
    expect(textoCosto({ tipo: "pendiente" })).toBeNull();
    expect(textoCosto({ tipo: "fijo" })).toBeNull();
    expect(textoCosto({ tipo: "gratuito" })).toBe("Gratuito (según la fuente)");
    expect(textoCosto({ tipo: "fijo", texto: " $117.31 (1 UMA) " })).toBe("$117.31 (1 UMA)");
  });
});
