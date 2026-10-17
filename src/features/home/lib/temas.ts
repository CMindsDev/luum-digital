import { msg } from "@/i18n";

/**
 * «Explora por tema»: las seis bandas temáticas del tablero Figma 32:162 (bandas 04–09), cada una con
 * enlaces a módulos reales del prototipo. Los pies (descriptores) son texto de diseño adaptado a lo
 * que la app ofrece hoy; los teléfonos y servicios concretos salen siempre del catálogo verificado.
 */
import { FOTOS_BANDA, ICONOS_BANDA } from "@/design-system/lib/recursos-laboratorio";

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
    lineaSans: msg("Salud y"),
    lineaSerif: msg("Bienestar"),
    descriptor: msg("Línea de la Vida, atención psicológica y prevención del suicidio."),
    foto: FOTOS_BANDA.salud,
    posicionFoto: "60% 50%",
    icono: ICONOS_BANDA.salud,
    alineacion: "izquierda",
    enlaces: [
      { etiqueta: msg("Ir a Bienestar"), ruta: "/bienestar", guia: "inicio.tema_salud" },
      { etiqueta: msg("Apoyo psicológico"), ruta: "/bienestar/salud-mental", guia: "inicio.tema_salud_mental" },
    ],
  },
  {
    id: "seguridad",
    lineaSans: msg("Seguridad y"),
    lineaSerif: msg("Protección"),
    descriptor: msg("Línea Mujer, 911, atención a emergencias y prevención de la violencia."),
    foto: `${BASE}/foto-seguridad-tramites.jpg`,
    icono: `${BASE}/glifo-seccion-blanco.svg`,
    alineacion: "derecha",
    enlaces: [{ etiqueta: msg("Línea Mujer"), ruta: "/bienestar/linea-mujer", guia: "inicio.tema_linea_mujer" }],
    conAyudaInmediata: true,
  },
  {
    id: "movilidad",
    lineaSans: msg("Movilidad y"),
    lineaSerif: msg("Tránsito"),
    descriptor: msg("Tránsito y movilidad urbana: lo que hoy está en el catálogo municipal."),
    foto: `${BASE}/foto-movilidad-transito.jpg`,
    icono: `${BASE}/glifo-seccion-cafe.svg`,
    alineacion: "izquierda",
    enlaces: [{ etiqueta: msg("Buscar tránsito y movilidad"), ruta: "/buscar?q=tr%C3%A1nsito%20y%20movilidad", guia: "inicio.tema_movilidad" }],
  },
  {
    id: "medio_ambiente",
    lineaSans: msg("Medio ambiente"),
    lineaSerif: msg("y sostenibilidad"),
    descriptor: msg("Arbolado urbano, áreas verdes y cuidado ambiental."),
    foto: `${BASE}/foto-medio-ambiente.jpg`,
    icono: `${BASE}/icono-seccion-medio-ambiente.svg`,
    alineacion: "izquierda",
    largo: true,
    enlaces: [{ etiqueta: msg("Ver servicios de medio ambiente"), ruta: "/servicios/categoria/medio_ambiente", guia: "inicio.tema_medio_ambiente" }],
  },
  {
    id: "tramites",
    lineaSans: msg("Trámites y"),
    lineaSerif: msg("Atención"),
    descriptor: msg("Catálogo del Portal Ciudadano, pagos simulados, consultas y seguimiento de tus gestiones."),
    foto: FOTOS_BANDA.tramites,
    icono: `${BASE}/glifo-seccion-cafe.svg`,
    alineacion: "derecha",
    enlaces: [
      { etiqueta: msg("Trámites y servicios"), ruta: "/servicios", guia: "inicio.tema_tramites" },
      { etiqueta: msg("Mis gestiones"), ruta: "/gestiones", guia: "inicio.tema_gestiones" },
    ],
  },
  {
    id: "territorio",
    lineaSans: msg("Desarrollo Urbano"),
    lineaSerif: msg("y territorio"),
    descriptor: msg("Mapa de la ciudad, catastro y desarrollo urbano. Sin capas oficiales: el mapa muestra datos de demostración."),
    foto: `${BASE}/foto-desarrollo-urbano.jpg`,
    icono: `${BASE}/glifo-seccion-blanco.svg`,
    alineacion: "centro",
    largo: true,
    enlaces: [
      { etiqueta: msg("Abrir el mapa"), ruta: "/mapa", guia: "inicio.tema_mapa" },
      { etiqueta: msg("Catastro y desarrollo urbano"), ruta: "/servicios/categoria/territorio", guia: "inicio.tema_territorio" },
    ],
  },
];
