import {
  Bell,
  ClipboardList,
  FolderOpen,
  House,
  LayoutGrid,
  Map as MapIcon,
  Megaphone,
  ShieldCheck,
  Trophy,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { msg } from "@/i18n";
import type { Rol } from "@/types";
import { IconoSaludBienestar } from "@/design-system/components/IconoSaludBienestar";

export type SeccionId =
  | "inicio"
  | "servicios"
  | "reportes"
  | "mapa"
  | "bienestar"
  | "participacion"
  | "expediente"
  | "gestiones"
  | "notificaciones"
  | "operador"
  | "cuenta";

export interface SeccionNavegacion {
  id: SeccionId;
  /** Nombre completo (barra lateral de escritorio, hoja «Más», nombre accesible). */
  etiqueta: string;
  /** Nombre corto visible en la barra inferior y en la navegación compacta de tableta. */
  etiquetaCorta: string;
  ruta: string;
  icono: LucideIcon;
  /** Prefijos de ruta que activan la sección (además de `ruta`). */
  prefijos: string[];
  /** Si se define, sólo estos roles ven la sección. */
  roles?: Rol[];
  /** Identificador estable para el asistente y las pruebas (data-guia). */
  guia: string;
  /** Tono de mosaico del Laboratorio para accesos en Inicio. */
  tono: "azul" | "ambar" | "cafe" | "magenta" | "lima" | "marino";
  descripcion: string;
}

/** Todas las secciones del AppShell, en el orden de la barra lateral de escritorio. */
export const SECCIONES: readonly SeccionNavegacion[] = [
  {
    id: "inicio",
    etiqueta: msg("Inicio"),
    etiquetaCorta: msg("Inicio"),
    ruta: "/",
    icono: House,
    prefijos: ["/buscar"],
    guia: "nav.inicio",
    tono: "marino",
    descripcion: msg("Buscar y accesos rápidos"),
  },
  {
    id: "servicios",
    etiqueta: msg("Trámites y servicios"),
    etiquetaCorta: msg("Servicios"),
    ruta: "/servicios",
    icono: LayoutGrid,
    prefijos: ["/servicios"],
    guia: "nav.servicios",
    tono: "azul",
    descripcion: msg("Catálogo municipal con fuentes oficiales"),
  },
  {
    id: "reportes",
    etiqueta: msg("Reportes"),
    etiquetaCorta: msg("Reportes"),
    ruta: "/reportes",
    icono: Megaphone,
    prefijos: ["/reportes"],
    guia: "nav.reportes",
    tono: "ambar",
    descripcion: msg("Baches, luminarias, basura y más"),
  },
  {
    id: "mapa",
    etiqueta: msg("Mapa / Visor Urbano"),
    etiquetaCorta: msg("Mapa"),
    ruta: "/mapa",
    icono: MapIcon,
    prefijos: ["/mapa"],
    guia: "nav.mapa",
    tono: "lima",
    descripcion: msg("Incidencias de demostración y ubicaciones"),
  },
  {
    id: "bienestar",
    etiqueta: msg("Bienestar"),
    etiquetaCorta: msg("Bienestar"),
    ruta: "/bienestar",
    icono: IconoSaludBienestar,
    prefijos: ["/bienestar"],
    guia: "nav.bienestar",
    tono: "magenta",
    descripcion: msg("Salud, salud mental y Línea Mujer"),
  },
  {
    id: "participacion",
    etiqueta: msg("Participación y recompensas"),
    etiquetaCorta: msg("Participación"),
    ruta: "/participacion",
    icono: Trophy,
    prefijos: ["/participacion"],
    guia: "nav.participacion",
    tono: "lima",
    descripcion: msg("Verifica reparaciones y suma puntos"),
  },
  {
    id: "expediente",
    etiqueta: msg("Mi expediente"),
    etiquetaCorta: msg("Expediente"),
    ruta: "/expediente",
    icono: FolderOpen,
    prefijos: ["/expediente"],
    guia: "nav.expediente",
    tono: "cafe",
    descripcion: msg("Perfil y documentos de ejemplo"),
  },
  {
    id: "gestiones",
    etiqueta: msg("Mis gestiones"),
    etiquetaCorta: msg("Gestiones"),
    ruta: "/gestiones",
    icono: ClipboardList,
    prefijos: ["/gestiones"],
    guia: "nav.gestiones",
    tono: "azul",
    descripcion: msg("Seguimiento de trámites simulados"),
  },
  {
    id: "notificaciones",
    etiqueta: msg("Notificaciones"),
    etiquetaCorta: msg("Notificaciones"),
    ruta: "/notificaciones",
    icono: Bell,
    prefijos: ["/notificaciones"],
    guia: "nav.notificaciones",
    tono: "ambar",
    descripcion: msg("Avisos de tus gestiones y reportes"),
  },
  {
    id: "operador",
    etiqueta: msg("Operador de demostración"),
    etiquetaCorta: msg("Operador"),
    ruta: "/operador",
    icono: ShieldCheck,
    prefijos: ["/operador"],
    roles: ["operador", "administracion"],
    guia: "nav.operador",
    tono: "marino",
    descripcion: msg("Validar reportes y revisar verificaciones"),
  },
  {
    id: "cuenta",
    etiqueta: msg("Cuenta de demostración"),
    etiquetaCorta: msg("Cuenta"),
    ruta: "/cuenta",
    icono: UserRound,
    prefijos: ["/cuenta"],
    guia: "nav.cuenta",
    tono: "cafe",
    descripcion: msg("Identidad ficticia y controles de la demo"),
  },
];

/** Secciones fijas de la barra inferior móvil (la quinta posición es «Más»). */
export const SECCIONES_BARRA_INFERIOR: readonly SeccionId[] = ["inicio", "servicios", "reportes", "mapa"];

export function seccionesVisibles(rol: Rol): SeccionNavegacion[] {
  return SECCIONES.filter((seccion) => !seccion.roles || seccion.roles.includes(rol));
}

/** Sección activa para una ruta (el prefijo más largo gana). */
export function seccionDeRuta(pathname: string): SeccionNavegacion | undefined {
  if (pathname === "/") return SECCIONES[0];
  let mejor: { seccion: SeccionNavegacion; largo: number } | undefined;
  for (const seccion of SECCIONES) {
    for (const prefijo of [seccion.ruta, ...seccion.prefijos]) {
      if (prefijo === "/") continue;
      if ((pathname === prefijo || pathname.startsWith(`${prefijo}/`)) && (!mejor || prefijo.length > mejor.largo)) {
        mejor = { seccion, largo: prefijo.length };
      }
    }
  }
  return mejor?.seccion;
}
