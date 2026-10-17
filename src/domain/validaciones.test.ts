import { describe, expect, it } from "vitest";
import {
  aportacionSchema,
  codigoPostalSchema,
  coordenadasMeridaSchema,
  correoSchema,
  descripcionReporteSchema,
  motivoObligatorioSchema,
  nuevoReporteSchema,
  nuevaVerificacionSchema,
  primerError,
  telefonoFicticioSchema,
  validarFoto,
  TAMANO_MAXIMO_FOTO_BYTES,
} from "./validaciones";
import { entradaReporte } from "@/test/fixtures";

describe("validación de formularios", () => {
  it("la descripción del reporte exige 15 a 300 caracteres", () => {
    expect(descripcionReporteSchema.safeParse("corto").success).toBe(false);
    expect(descripcionReporteSchema.safeParse("a".repeat(14)).success).toBe(false);
    expect(descripcionReporteSchema.safeParse("a".repeat(15)).success).toBe(true);
    expect(descripcionReporteSchema.safeParse("a".repeat(300)).success).toBe(true);
    expect(descripcionReporteSchema.safeParse("a".repeat(301)).success).toBe(false);
    // Los espacios al inicio y al final no cuentan.
    expect(descripcionReporteSchema.safeParse("   corto   ").success).toBe(false);
  });

  it("acepta un reporte completo y devuelve mensajes legibles cuando falta algo", () => {
    expect(nuevoReporteSchema.safeParse(entradaReporte()).success).toBe(true);
    const mal = nuevoReporteSchema.safeParse({ ...entradaReporte(), descripcion: "nada", categoria: "alumbrado" });
    expect(mal.success).toBe(false);
    if (!mal.success) expect(primerError(mal.error).length).toBeGreaterThan(5);
  });

  it("rechaza ubicaciones fuera del municipio de Mérida", () => {
    expect(coordenadasMeridaSchema.safeParse({ lat: 20.9674, lng: -89.6243 }).success).toBe(true);
    expect(coordenadasMeridaSchema.safeParse({ lat: 19.43, lng: -99.13 }).success).toBe(false);
    expect(coordenadasMeridaSchema.safeParse({ lat: 20.9674 }).success).toBe(false);
  });

  it("valida la foto sólo por tipo y tamaño (nunca se persiste)", () => {
    expect(validarFoto({ type: "image/jpeg", size: 1024 })).toBeNull();
    expect(validarFoto({ type: "image/png", size: TAMANO_MAXIMO_FOTO_BYTES })).toBeNull();
    expect(validarFoto({ type: "image/webp", size: 10 })).toBeNull();
    expect(validarFoto({ type: "application/pdf", size: 10 })).toMatch(/JPG, PNG o WebP/);
    expect(validarFoto({ type: "image/gif", size: 10 })).not.toBeNull();
    expect(validarFoto({ type: "image/jpeg", size: TAMANO_MAXIMO_FOTO_BYTES + 1 })).toMatch(/5 MB/);
  });

  it("valida teléfonos ficticios de 10 dígitos, correos y códigos postales", () => {
    expect(telefonoFicticioSchema.safeParse("999 000 0000").success).toBe(true);
    expect(telefonoFicticioSchema.safeParse("12345").success).toBe(false);
    expect(correoSchema.safeParse("ana@ejemplo.mx").success).toBe(true);
    expect(correoSchema.safeParse("sin-arroba").success).toBe(false);
    expect(codigoPostalSchema.safeParse("97000").success).toBe(true);
    expect(codigoPostalSchema.safeParse("9700").success).toBe(false);
  });

  it("una aportación pide información suficiente", () => {
    expect(aportacionSchema.safeParse({ descripcion: "El bache sigue creciendo", tieneFoto: false }).success).toBe(true);
    expect(aportacionSchema.safeParse({ descripcion: "ya", tieneFoto: false }).success).toBe(false);
  });

  it("toda reversión, rechazo o cancelación exige un motivo", () => {
    expect(motivoObligatorioSchema.safeParse("").success).toBe(false);
    expect(motivoObligatorioSchema.safeParse("no").success).toBe(false);
    expect(motivoObligatorioSchema.safeParse("Validación incorrecta").success).toBe(true);
  });

  it("una verificación exige elegir qué se observó", () => {
    const base = { reporteId: "rep-1", resultado: "problema_persiste", comentario: "", ubicacionConfirmada: true, tieneFoto: false };
    expect(nuevaVerificacionSchema.safeParse(base).success).toBe(true);
    expect(nuevaVerificacionSchema.safeParse({ ...base, resultado: "otra cosa" }).success).toBe(false);
  });
});
