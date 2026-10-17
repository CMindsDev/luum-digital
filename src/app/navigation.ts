import {
  Bell,
  ClipboardList,
  FolderOpen,
  HeartHandshake,
  House,
  LayoutGrid,
  Map as MapIcon,
  Megaphone,
  ShieldCheck,
  Trophy,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { Rol } from "@/types";

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
    etiqueta: "Inicio",
    etiquetaCorta: "Inicio",
    ruta: "/",
    icono: House,
    prefijos: ["/buscar"],
    guia: "nav.inicio",
    tono: "marino",
    descripcion: "Buscar y accesos rápidos",
  },
  {
    id: "servicios",
    etiqueta: "Trámites y servicios",
    etiquetaCorta: "Servicios",
    ruta: "/servicios",
    icono: LayoutGrid,
    prefijos: ["/servicios"],
    guia: "nav.servicios",
    tono: "azul",
    descripcion: "Catálogo municipal con fuentes oficiales",
  },
  {
    id: "reportes",
    etiqueta: "Reportes",
    etiquetaCorta: "Reportes",
    ruta: "/reportes",
    icono: Megaphone,
    prefijos: ["/reportes"],
    guia: "nav.reportes",
    tono: "ambar",
    descripcion: "Baches, luminarias, basura y más",
  },
  {
    id: "mapa",
    etiqueta: "Mapa / Visor Urbano",
    etiquetaCorta: "Mapa",
    ruta: "/mapa",
    icono: MapIcon,
    prefijos: ["/mapa"],
    guia: "nav.mapa",
    tono: "lima",
    descripcion: "Incidencias de demostración y ubicaciones",
  },
  {
    id: "bienestar",
    etiqueta: "Bienestar",
    etiquetaCorta: "Bienestar",
    ruta: "/bienestar",
    icono: HeartHandshake,
    prefijos: ["/bienestar"],
    guia: "nav.bienestar",
    tono: "magenta",
    descripcion: "Salud, salud mental y Línea Mujer",
  },
  {
    id: "participacion",
    etiqueta: "Participación y recompensas",
    etiquetaCorta: "Participación",
    ruta: "/participacion",
    icono: Trophy,
    prefijos: ["/participacion"],
    guia: "nav.participacion",
    tono: "lima",
    descripcion: "Verifica reparaciones y suma puntos",
  },
  {
    id: "expediente",
    etiqueta: "Mi expediente",
    etiquetaCorta: "Expediente",
    ruta: "/expediente",
    icono: FolderOpen,
    prefijos: ["/expediente"],
    guia: "nav.expediente",
    tono: "cafe",
    descripcion: "Perfil y documentos de ejemplo",
  },
  {
    id: "gestiones",
    etiqueta: "Mis gestiones",
    etiquetaCorta: "Gestiones",
    ruta: "/gestiones",
    icono: ClipboardList,
    prefijos: ["/gestiones"],
    guia: "nav.gestiones",
    tono: "azul",
    descripcion: "Seguimiento de trámites simulados",
  },
  {
    id: "notificaciones",
    etiqueta: "Notificaciones",
    etiquetaCorta: "Notificaciones",
    ruta: "/notificaciones",
    icono: Bell,
    prefijos: ["/notificaciones"],
    guia: "nav.notificaciones",
    tono: "ambar",
    descripcion: "Avisos de tus gestiones y reportes",
  },
  {
    id: "operador",
    etiqueta: "Operador de demostración",
    etiquetaCorta: "Operador",
    ruta: "/operador",
    icono: ShieldCheck,
    prefijos: ["/operador"],
    roles: ["operador", "administracion"],
    guia: "nav.operador",
    tono: "marino",
    descripcion: "Validar reportes y revisar verificaciones",
  },
  {
    id: "cuenta",
    etiqueta: "Cuenta de demostración",
    etiquetaCorta: "Cuenta",
    ruta: "/cuenta",
    icono: UserRound,
    prefijos: ["/cuenta"],
    guia: "nav.cuenta",
    tono: "cafe",
    descripcion: "Identidad ficticia y controles de la demo",
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
