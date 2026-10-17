import { describe, expect, it } from "vitest";
import { mostrarDetalleNotificacion, PREFERENCIAS_EDITABLES } from "./privacidad";

describe("privacidad del expediente", () => {
  it("la confirmación antes de reutilizar no es una preferencia editable", () => {
    expect(PREFERENCIAS_EDITABLES.map((preferencia) => preferencia.clave)).not.toContain("confirmarAntesDeReutilizar");
  });

  it("oculta el detalle de notificaciones sensibles, discretas o mientras carga la privacidad", () => {
    expect(mostrarDetalleNotificacion({ sensible: false }, { notificacionesDiscretas: false })).toBe(true);
    expect(mostrarDetalleNotificacion({ sensible: false }, { notificacionesDiscretas: true })).toBe(false);
    expect(mostrarDetalleNotificacion({ sensible: true }, { notificacionesDiscretas: false })).toBe(false);
    expect(mostrarDetalleNotificacion({ sensible: false }, undefined)).toBe(false);
  });
});
