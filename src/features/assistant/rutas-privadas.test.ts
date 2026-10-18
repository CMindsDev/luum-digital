import { describe, expect, it } from "vitest";
import { esRutaSinPekito } from "./rutas-privadas";

describe("esRutaSinPekito", () => {
  it("oculta a Peekito en salud mental y Línea Mujer, con subrutas y barra final", () => {
    for (const ruta of [
      "/bienestar/salud-mental",
      "/bienestar/salud-mental/",
      "/bienestar/salud-mental/acompanante",
      "/bienestar/linea-mujer",
      "/bienestar/linea-mujer/solicitud",
    ]) {
      expect(esRutaSinPekito(ruta), ruta).toBe(true);
    }
  });

  it("no lo oculta en el resto de la app, incluido Bienestar", () => {
    for (const ruta of ["/", "/bienestar", "/bienestar/programas", "/reportes/nuevo/bache", "/servicios/salud-mental-x", "/bienestar/salud-mentalidad"]) {
      expect(esRutaSinPekito(ruta), ruta).toBe(false);
    }
  });
});
