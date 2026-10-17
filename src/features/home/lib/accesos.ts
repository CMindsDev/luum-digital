/**
 * Accesos rápidos de Inicio con los mosaicos del tablero Figma 32:162 (nodos 22:1352–22:1355 y
 * 22:951): fondo de color + glifo pixelado al 66 %. El orden de colores es el del tablero (azul,
 * ámbar, café, magenta y lima); el banner degradado con el patrón de cadena es la tarjeta destacada.
 */
import { ICONOS_BANDA } from "@/design-system/lib/recursos-laboratorio";

export type TonoAcceso = "azul" | "ambar" | "cafe" | "magenta" | "lima";

export interface AccesoRapido {
  etiqueta: string;
  ruta: string;
  tono: TonoAcceso;
  /** Glifo del Laboratorio con el color de contraste de cada fondo (crema o café). */
  glifo: string;
  guia: string;
}

const GLIFOS = "/brand/laboratorio/tablero";

export const ACCESOS_RAPIDOS: readonly AccesoRapido[] = [
  { etiqueta: "Trámites y servicios", ruta: "/servicios", tono: "azul", glifo: `${GLIFOS}/glifo-mosaico-azul.svg`, guia: "inicio.acceso_servicios" },
  { etiqueta: "Mis gestiones", ruta: "/gestiones", tono: "ambar", glifo: `${GLIFOS}/glifo-mosaico-ambar-b.svg`, guia: "inicio.acceso_gestiones" },
  { etiqueta: "Visor Urbano", ruta: "/mapa", tono: "cafe", glifo: `${GLIFOS}/glifo-mosaico-cafe.svg`, guia: "inicio.acceso_mapa" },
  { etiqueta: "Bienestar", ruta: "/bienestar", tono: "magenta", glifo: ICONOS_BANDA.salud, guia: "inicio.acceso_bienestar" },
  { etiqueta: "Mi expediente", ruta: "/expediente", tono: "lima", glifo: `${GLIFOS}/glifo-mosaico-lima.svg`, guia: "inicio.acceso_expediente" },
];

/** Tarjeta destacada (banner 22:1356): Bache a la vista. */
export const ACCESO_DESTACADO = {
  etiqueta: "Bache a la vista",
  descripcion: "Reporta un bache",
  ruta: "/reportes/nuevo/bache",
  guia: "inicio.acceso_bache",
} as const;
