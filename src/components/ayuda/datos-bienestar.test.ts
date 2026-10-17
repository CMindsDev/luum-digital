import { describe, expect, it } from "vitest";
import { LINEAS_AYUDA, PROGRAMAS_BIENESTAR, UBICACIONES_SERVICIO } from "@/data/bienestar";

/** Reglas de datos de bienestar (sólo verificados, con fuente y fecha; nada inventado). */
describe("datos de bienestar", () => {
  const texto = JSON.stringify({ LINEAS_AYUDA, PROGRAMAS_BIENESTAR, UBICACIONES_SERVICIO });

  it("no usa números ni correos descartados por la verificación", () => {
    expect(texto).not.toMatch(/990\s?101\s?0714|9901010714/);
    expect(texto).not.toMatch(/correo@merida\.gob\.mx/);
    expect(texto).not.toMatch(/9999999999/);
    expect(texto).not.toMatch(/923\s?09\s?73/);
    // La extensión 81951 es del módulo de Caucel: no se muestra como línea de citas.
    expect(texto).not.toMatch(/81951/);
    // Correo con tilde (errata de la ficha): se usa la forma del mailto oficial.
    expect(texto).not.toMatch(/psicología@/);
  });

  it("cada línea tiene fuente https, fecha de consulta y número marcable", () => {
    for (const linea of LINEAS_AYUDA) {
      expect(linea.fuente.url).toMatch(/^https:\/\//);
      expect(linea.fuente.fechaConsulta).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(linea.telefonoMarcable).toMatch(/^[\d,+]+$/);
    }
  });

  it("911 va primero, Línea Mujer es 24/7 y Línea de la Vida queda pendiente de verificar", () => {
    expect(LINEAS_AYUDA[0]?.telefonoMarcable).toBe("911");
    const lineaMujer = LINEAS_AYUDA.find((linea) => linea.id === "linea-mujer");
    expect(lineaMujer?.telefonoMarcable).toBe("8004557672");
    expect(lineaMujer?.disponibilidad).toMatch(/24 horas/);
    expect(LINEAS_AYUDA.find((linea) => linea.id === "linea-de-la-vida")?.verificado).toBe(false);
  });

  it("Alma Nova es con cita y no se presenta como línea de crisis", () => {
    const almaNova = LINEAS_AYUDA.find((linea) => linea.id === "apoyo-psicologico-alma-nova");
    expect(almaNova?.descripcion).toMatch(/no es una línea de crisis/);
    expect(almaNova?.disponibilidad).not.toMatch(/24/);
  });

  it("los programas tienen fuente y los verificados enlazan su ficha del catálogo", () => {
    for (const programa of PROGRAMAS_BIENESTAR) {
      expect(programa.fuente.url).toMatch(/^https:\/\//);
      if (programa.fuente.url.includes("portalciudadano")) expect(programa.servicioId).toMatch(/^mid-/);
    }
    expect(PROGRAMAS_BIENESTAR.find((programa) => programa.id === "prog-ruta-salud-mental")?.estadoDeInformacion).toBe("pendiente");
  });
});
