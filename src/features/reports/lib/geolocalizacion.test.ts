import { describe, expect, it, vi } from "vitest";
import { MENSAJE_FALLO_UBICACION, motivoDeError, solicitarUbicacionDispositivo } from "./geolocalizacion";

function posicion(lat: number, lng: number, accuracy = 12): GeolocationPosition {
  return {
    coords: { latitude: lat, longitude: lng, accuracy, altitude: null, altitudeAccuracy: null, heading: null, speed: null, toJSON: () => ({}) },
    timestamp: Date.now(),
    toJSON: () => ({}),
  };
}

function errorGeo(code: number): GeolocationPositionError {
  return { code, message: "", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 };
}

describe("ubicación del dispositivo", () => {
  it("sin soporte explica y no falla", async () => {
    await expect(solicitarUbicacionDispositivo(undefined)).resolves.toEqual({ ok: false, motivo: "sin_soporte", mensaje: MENSAJE_FALLO_UBICACION.sin_soporte });
  });

  it("permiso denegado: mensaje amable para seguir con dirección o mapa", async () => {
    const geo = { getCurrentPosition: vi.fn((_ok: PositionCallback, error?: PositionErrorCallback | null) => error?.(errorGeo(1))) };
    const resultado = await solicitarUbicacionDispositivo(geo);
    expect(resultado).toMatchObject({ ok: false, motivo: "denegada" });
    expect(resultado.ok ? "" : resultado.mensaje).toMatch(/escribe la dirección o elígela en el mapa/);
  });

  it("traduce los códigos de error", () => {
    expect(motivoDeError(1)).toBe("denegada");
    expect(motivoDeError(2)).toBe("no_disponible");
    expect(motivoDeError(3)).toBe("tiempo_agotado");
  });

  it("acepta una ubicación dentro de Mérida y rechaza una de fuera", async () => {
    const dentro = { getCurrentPosition: vi.fn((ok: PositionCallback) => ok(posicion(20.9696, -89.6229, 8.4))) };
    await expect(solicitarUbicacionDispositivo(dentro)).resolves.toEqual({ ok: true, coordenadas: { lat: 20.9696, lng: -89.6229 }, precisionMetros: 8 });
    const fuera = { getCurrentPosition: vi.fn((ok: PositionCallback) => ok(posicion(19.43, -99.13))) };
    await expect(solicitarUbicacionDispositivo(fuera)).resolves.toMatchObject({ ok: false, motivo: "fuera_de_merida" });
  });

  it("si el navegador lanza una excepción, la trata como no disponible", async () => {
    const geo = {
      getCurrentPosition: vi.fn(() => {
        throw new Error("bloqueado");
      }),
    };
    await expect(solicitarUbicacionDispositivo(geo)).resolves.toMatchObject({ ok: false, motivo: "no_disponible" });
  });
});
