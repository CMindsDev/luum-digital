import { describe, expect, it } from "vitest";
import { derivarEstadoMascota, ESTADOS_MASCOTA, type EntradaEstadoMascota } from "./estado-mascota";

const base: EntradaEstadoMascota = { estadoSesion: "inactivo", vozActiva: false, accionesEnCurso: [], mensajes: [] };

describe("derivarEstadoMascota", () => {
  it("sin actividad está en reposo", () => {
    expect(derivarEstadoMascota(base)).toBe("reposo");
    expect(derivarEstadoMascota({ ...base, estadoSesion: "listo" })).toBe("reposo");
  });

  it("sigue los estados de la sesión", () => {
    expect(derivarEstadoMascota({ ...base, estadoSesion: "conectando" })).toBe("conectando");
    expect(derivarEstadoMascota({ ...base, estadoSesion: "pensando" })).toBe("pensando");
    expect(derivarEstadoMascota({ ...base, estadoSesion: "hablando", vozActiva: true })).toBe("hablando");
  });

  it("en llamada escucha, o duerme si el micrófono está silenciado", () => {
    expect(derivarEstadoMascota({ ...base, estadoSesion: "escuchando", vozActiva: true })).toBe("escuchando");
    expect(derivarEstadoMascota({ ...base, estadoSesion: "listo", vozActiva: true })).toBe("escuchando");
    expect(derivarEstadoMascota({ ...base, estadoSesion: "listo", vozActiva: true, silenciado: true })).toBe("silenciado");
  });

  it("habla mientras llega texto del asistente, aunque no haya voz", () => {
    expect(derivarEstadoMascota({ ...base, estadoSesion: "listo", mensajes: [{ rol: "asistente", pendiente: true }] })).toBe("hablando");
    expect(derivarEstadoMascota({ ...base, estadoSesion: "listo", mensajes: [{ rol: "asistente", pendiente: false }] })).toBe("reposo");
    expect(derivarEstadoMascota({ ...base, estadoSesion: "listo", mensajes: [{ rol: "persona", pendiente: true }] })).toBe("reposo");
  });

  it("una acción en pantalla gana a pensar y a hablar", () => {
    const accion = [{ llamadaId: "a1" }];
    expect(derivarEstadoMascota({ ...base, estadoSesion: "pensando", accionesEnCurso: accion })).toBe("trabajando");
    expect(derivarEstadoMascota({ ...base, estadoSesion: "hablando", vozActiva: true, accionesEnCurso: accion })).toBe("trabajando");
  });

  it("el error reciente se nota por encima de todo; la alegría no tapa el trabajo", () => {
    expect(derivarEstadoMascota({ ...base, estadoSesion: "pensando", accionesEnCurso: [{ llamadaId: "a1" }], momento: "triste" })).toBe("triste");
    expect(derivarEstadoMascota({ ...base, momento: "feliz" })).toBe("feliz");
    expect(derivarEstadoMascota({ ...base, estadoSesion: "pensando", momento: "feliz" })).toBe("pensando");
  });

  it("todos los estados existen una sola vez", () => {
    expect(new Set(ESTADOS_MASCOTA).size).toBe(ESTADOS_MASCOTA.length);
  });
});
