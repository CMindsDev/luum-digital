/**
 * Matemática pura de la capa de actuación (portada de Alex/Marea, alex-act-path.ts): cuánto vuela
 * el cursor guía desde Pekito, por qué arco, dónde aterriza y cómo el anillo rodea el control.
 * Sin DOM, para poder probarla.
 */

export interface Punto {
  x: number;
  y: number;
}

/** Bordes de un rectángulo en píxeles de la ventana (como DOMRect). */
export interface Caja {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export const ACTUACION = {
  cursorPx: 16,
  vueloMinMs: 220,
  vueloMaxMs: 420,
  /** Distancia a la que el vuelo tarda lo máximo. */
  vueloLejosPx: 900,
  cuadros: 16,
  presionMs: 120,
  presionEscala: 0.85,
  desvanecerMs: 180,
  pulsoMs: 450,
  /** Movimiento reducido: un anillo quieto que sólo aparece y desaparece. */
  anilloQuietoMs: 900,
  /** El borde de pantalla sólo aparece en acciones que tardan más que esto. */
  bordeTrasMs: 250,
  anilloSeparacionPx: 3,
  anilloLineaPx: 2,
  /** Señales que nunca recibieron su recibo dejan de mostrarse tras este tiempo. */
  caducidadMs: 12_000,
} as const;

const CURVA = 0.18;
const CURVA_MAX_PX = 80;

function acotar(valor: number, minimo: number, maximo: number): number {
  return Math.min(maximo, Math.max(minimo, valor));
}

export function distancia(desde: Punto, hasta: Punto): number {
  return Math.hypot(hasta.x - desde.x, hasta.y - desde.y);
}

/** 220 ms para un salto corto, hasta 420 ms con la distancia. */
export function duracionVuelo(desde: Punto, hasta: Punto): number {
  const tramo = distancia(desde, hasta);
  if (!Number.isFinite(tramo)) return ACTUACION.vueloMinMs;
  const parte = acotar(tramo / ACTUACION.vueloLejosPx, 0, 1);
  return Math.round(ACTUACION.vueloMinMs + (ACTUACION.vueloMaxMs - ACTUACION.vueloMinMs) * parte);
}

/** Salida rápida desde la mascota y llegada suave (cúbica). */
export function suavizar(t: number): number {
  const progreso = acotar(t, 0, 1);
  return 1 - (1 - progreso) ** 3;
}

/** Punto de control del arco: el punto medio desplazado a un lado, siempre curvado hacia arriba. */
export function controlDeVuelo(desde: Punto, hasta: Punto): Punto {
  const medio = { x: (desde.x + hasta.x) / 2, y: (desde.y + hasta.y) / 2 };
  const tramo = distancia(desde, hasta);
  if (tramo === 0) return medio;
  const curva = Math.min(tramo * CURVA, CURVA_MAX_PX);
  let nx = -(hasta.y - desde.y) / tramo;
  let ny = (hasta.x - desde.x) / tramo;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  return { x: medio.x + nx * curva, y: medio.y + ny * curva };
}

export function puntoEnVuelo(desde: Punto, control: Punto, hasta: Punto, t: number): Punto {
  const s = acotar(t, 0, 1);
  const a = (1 - s) ** 2;
  const b = 2 * (1 - s) * s;
  const c = s ** 2;
  return { x: a * desde.x + b * control.x + c * hasta.x, y: a * desde.y + b * control.y + c * hasta.y };
}

/** Cuadros equiespaciados sobre el arco con la suavidad incluida; termina exactamente en `hasta`. */
export function cuadrosDeVuelo(desde: Punto, hasta: Punto, cantidad: number = ACTUACION.cuadros): Punto[] {
  const pasos = Math.max(1, Math.floor(cantidad));
  const control = controlDeVuelo(desde, hasta);
  const cuadros: Punto[] = [];
  for (let i = 0; i <= pasos; i += 1) cuadros.push(puntoEnVuelo(desde, control, hasta, suavizar(i / pasos)));
  cuadros[cuadros.length - 1] = { ...hasta };
  return cuadros;
}

/** Dónde aterriza el cursor: el centro de la parte visible del control, o el punto visible más cercano. */
export function puntoDeAterrizaje(rect: Caja, area: Caja): Punto {
  const izquierda = Math.max(rect.left, area.left);
  const arriba = Math.max(rect.top, area.top);
  const derecha = Math.min(rect.right, area.right);
  const abajo = Math.min(rect.bottom, area.bottom);
  if (derecha > izquierda && abajo > arriba) return { x: (izquierda + derecha) / 2, y: (arriba + abajo) / 2 };
  return {
    x: acotar((rect.left + rect.right) / 2, area.left, area.right),
    y: acotar((rect.top + rect.bottom) / 2, area.top, area.bottom),
  };
}

export const ALCANCE_ANILLO_PX = ACTUACION.anilloSeparacionPx + ACTUACION.anilloLineaPx;

/** Caja del anillo: su línea de 2 px empieza 3 px fuera del control. */
export function cajaAnillo(rect: Caja): { left: number; top: number; width: number; height: number } {
  return {
    left: rect.left - ALCANCE_ANILLO_PX,
    top: rect.top - ALCANCE_ANILLO_PX,
    width: rect.right - rect.left + ALCANCE_ANILLO_PX * 2,
    height: rect.bottom - rect.top + ALCANCE_ANILLO_PX * 2,
  };
}

/** Radio calculado agrandado `por` píxeles para que el anillo siga la forma del control. */
export function agrandarRadio(valor: string, por: number): string {
  return valor.replace(/(\d*\.?\d+)px/g, (_, cantidad: string) => {
    const radio = Number(cantidad);
    return `${radio > 0 ? radio + por : 0}px`;
  });
}
