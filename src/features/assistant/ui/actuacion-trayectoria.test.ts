import { describe, expect, it } from "vitest";
import {
  ACTUACION,
  agrandarRadio,
  ALCANCE_ANILLO_PX,
  cajaAnillo,
  controlDeVuelo,
  cuadrosDeVuelo,
  duracionVuelo,
  puntoDeAterrizaje,
  suavizar,
} from "./actuacion-trayectoria";

describe("trayectoria del cursor guía", () => {
  it("la duración crece con la distancia entre 220 y 420 ms", () => {
    expect(duracionVuelo({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(ACTUACION.vueloMinMs);
    expect(duracionVuelo({ x: 0, y: 0 }, { x: 450, y: 0 })).toBe(320);
    expect(duracionVuelo({ x: 0, y: 0 }, { x: 5000, y: 0 })).toBe(ACTUACION.vueloMaxMs);
  });

  it("el arco siempre se curva hacia arriba y los cuadros terminan exactamente en el destino", () => {
    const desde = { x: 350, y: 760 };
    const hasta = { x: 80, y: 200 };
    expect(controlDeVuelo(desde, hasta).y).toBeLessThan((desde.y + hasta.y) / 2 + 1);
    const cuadros = cuadrosDeVuelo(desde, hasta);
    expect(cuadros).toHaveLength(ACTUACION.cuadros + 1);
    expect(cuadros[0]).toEqual(desde);
    expect(cuadros.at(-1)).toEqual(hasta);
    expect(suavizar(0)).toBe(0);
    expect(suavizar(1)).toBe(1);
  });

  it("aterriza en el centro visible del control o en el punto visible más cercano", () => {
    const area = { left: 0, top: 0, right: 400, bottom: 800 };
    expect(puntoDeAterrizaje({ left: 10, top: 10, right: 110, bottom: 54 }, area)).toEqual({ x: 60, y: 32 });
    expect(puntoDeAterrizaje({ left: 10, top: 900, right: 110, bottom: 944 }, area)).toEqual({ x: 60, y: 800 });
  });

  it("el anillo rodea el control con 3 px de separación y sigue su radio", () => {
    expect(cajaAnillo({ left: 10, top: 20, right: 110, bottom: 64 })).toEqual({
      left: 10 - ALCANCE_ANILLO_PX,
      top: 20 - ALCANCE_ANILLO_PX,
      width: 100 + ALCANCE_ANILLO_PX * 2,
      height: 44 + ALCANCE_ANILLO_PX * 2,
    });
    expect(agrandarRadio("14px", 5)).toBe("19px");
    expect(agrandarRadio("0px", 5)).toBe("0px");
    expect(agrandarRadio("50%", 5)).toBe("50%");
  });
});
