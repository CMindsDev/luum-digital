/**
 * «Explora por tema»: las seis bandas temáticas del tablero Figma 32:162 (bandas 04–09), cada una con
 * enlaces a módulos reales del prototipo. Los pies (descriptores) son texto de diseño adaptado a lo
 * que la app ofrece hoy; los teléfonos y servicios concretos salen siempre del catálogo verificado.
 */
export type FondoTema = "salud" | "seguridad" | "movilidad" | "medio_ambiente" | "tramites" | "territorio";
export type AlineacionTema = "izquierda" | "derecha" | "centro";

export interface EnlaceTema {
  etiqueta: string;
  ruta: string;
  guia: string;
}

export interface TemaInicio {
  id: FondoTema;
  /** Primera línea del titular (Host Grotesk). */
  lineaSans: string;
  /** Segunda línea del titular (Instrument Serif itálica). */
  lineaSerif: string;
  /** Pie en IBM Plex Mono, mayúsculas por CSS. */
  descriptor: string;
  foto: string;
  /** Recorte de la foto (object-position). */
  posicionFoto?: string;
  icono: string;
  alineacion: AlineacionTema;
  /** Titulares largos (×0.83 en el tablero). */
  largo?: boolean;
  enlaces: EnlaceTema[];
  /** Muestra el botón de ayuda inmediata (líneas humanas verificadas). */
  conAyudaInmediata?: boolean;
}

const BASE = "/brand/laboratorio/tablero";

export const TEMAS_INICIO: readonly TemaInicio[] = [
  {
    id: "salud",
    lineaSans: "Salud y",
    lineaSerif: "Bienestar",
    descriptor: "Línea de la Vida, atención psicológica y prevención del suicidio.",
    foto: `${BASE}/foto-salud-bienestar.jpg`,
    posicionFoto: "50% 34%",
    icono: `${BASE}/icono-seccion-salud.svg`,
    alineacion: "izquierda",
    enlaces: [
      { etiqueta: "Ir a Bienestar", ruta: "/bienestar", guia: "inicio.tema_salud" },
      { etiqueta: "Apoyo psicológico", ruta: "/bienestar/salud-mental", guia: "inicio.tema_salud_mental" },
    ],
  },
  {
    id: "seguridad",
    lineaSans: "Seguridad y",
    lineaSerif: "Protección",
    descriptor: "Línea Mujer, 911, atención a emergencias y prevención de la violencia.",
    foto: `${BASE}/foto-seguridad-tramites.jpg`,
    icono: `${BASE}/glifo-seccion-blanco.svg`,
    alineacion: "derecha",
    enlaces: [{ etiqueta: "Línea Mujer", ruta: "/bienestar/linea-mujer", guia: "inicio.tema_linea_mujer" }],
    conAyudaInmediata: true,
  },
  {
    id: "movilidad",
    lineaSans: "Movilidad y",
    lineaSerif: "Tránsito",
    descriptor: "Tránsito y movilidad urbana: lo que hoy está en el catálogo municipal.",
    foto: `${BASE}/foto-movilidad-transito.jpg`,
    icono: `${BASE}/glifo-seccion-cafe.svg`,
    alineacion: "izquierda",
    enlaces: [{ etiqueta: "Buscar tránsito y movilidad", ruta: "/buscar?q=tr%C3%A1nsito%20y%20movilidad", guia: "inicio.tema_movilidad" }],
  },
  {
    id: "medio_ambiente",
    lineaSans: "Medio ambiente",
    lineaSerif: "y sostenibilidad",
    descriptor: "Arbolado urbano, áreas verdes y cuidado ambiental.",
    foto: `${BASE}/foto-medio-ambiente.jpg`,
    icono: `${BASE}/icono-seccion-medio-ambiente.svg`,
    alineacion: "izquierda",
    largo: true,
    enlaces: [{ etiqueta: "Ver servicios de medio ambiente", ruta: "/servicios/categoria/medio_ambiente", guia: "inicio.tema_medio_ambiente" }],
  },
  {
    id: "tramites",
    lineaSans: "Trámites y",
    lineaSerif: "Atención",
    descriptor: "Catálogo del Portal Ciudadano, pagos simulados, consultas y seguimiento de tus gestiones.",
    // El tablero aún no tiene foto propia para Trámites: reutiliza la de Seguridad (como en Figma).
    foto: `${BASE}/foto-seguridad-tramites.jpg`,
    icono: `${BASE}/glifo-seccion-cafe.svg`,
    alineacion: "derecha",
    enlaces: [
      { etiqueta: "Trámites y servicios", ruta: "/servicios", guia: "inicio.tema_tramites" },
      { etiqueta: "Mis gestiones", ruta: "/gestiones", guia: "inicio.tema_gestiones" },
    ],
  },
  {
    id: "territorio",
    lineaSans: "Desarrollo Urbano",
    lineaSerif: "y territorio",
    descriptor: "Mapa de la ciudad, catastro y desarrollo urbano. Sin capas oficiales: el mapa muestra datos de demostración.",
    foto: `${BASE}/foto-desarrollo-urbano.jpg`,
    icono: `${BASE}/glifo-seccion-blanco.svg`,
    alineacion: "centro",
    largo: true,
    enlaces: [
      { etiqueta: "Abrir el mapa", ruta: "/mapa", guia: "inicio.tema_mapa" },
      { etiqueta: "Catastro y desarrollo urbano", ruta: "/servicios/categoria/territorio", guia: "inicio.tema_territorio" },
    ],
  },
];
