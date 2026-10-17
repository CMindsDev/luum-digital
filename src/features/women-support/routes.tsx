import { lazy } from "react";
import type { RouteObject } from "react-router";
import { msg } from "@/i18n";

/** Línea Mujer (carga diferida). Sin parámetros de URL con contenido. */
export const routes: RouteObject[] = [
  {
    path: "bienestar/linea-mujer",
    Component: lazy(() => import("./pages/WomenSupportPage")),
    handle: { titulo: msg("Línea Mujer"), regresar: "/bienestar" },
  },
];
