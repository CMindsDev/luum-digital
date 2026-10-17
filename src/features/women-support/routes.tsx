import { lazy } from "react";
import type { RouteObject } from "react-router";

/** Línea Mujer (carga diferida). Sin parámetros de URL con contenido. */
export const routes: RouteObject[] = [
  {
    path: "bienestar/linea-mujer",
    Component: lazy(() => import("./pages/WomenSupportPage")),
    handle: { titulo: "Línea Mujer", regresar: "/bienestar" },
  },
];
