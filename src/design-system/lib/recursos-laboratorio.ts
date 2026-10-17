/** Rutas de los recursos del tablero del Laboratorio (public/brand/laboratorio/tablero/). */
const BASE = "/brand/laboratorio/tablero";

export const ICONOS_BANDA = {
  salud: "/brand/icon-saludybienestar.svg",
  seguridad: `${BASE}/glifo-seccion-blanco.svg`,
  movilidad: `${BASE}/glifo-seccion-cafe.svg`,
  ambiente: `${BASE}/icono-seccion-medio-ambiente.svg`,
  tramites: `${BASE}/glifo-seccion-cafe.svg`,
  territorio: `${BASE}/glifo-seccion-blanco.svg`,
} as const;

export const FOTOS_BANDA = {
  hero: `${BASE}/foto-hero-calle.jpg`,
  salud: `${BASE}/foto-salud-bienestar.png`,
  seguridad: `${BASE}/foto-seguridad-tramites.jpg`,
  tramites: `${BASE}/foto-atencionciudadana.png`,
  movilidad: `${BASE}/foto-movilidad-transito.jpg`,
  ambiente: `${BASE}/foto-medio-ambiente.jpg`,
  territorio: `${BASE}/foto-desarrollo-urbano.jpg`,
} as const;
