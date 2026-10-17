import { lazy } from "react";
import type { RouteObject } from "react-router";

/** Salud mental (carga diferida). Sin parámetros de URL con contenido de la conversación. */
export const routes: RouteObject[] = [
  {
    path: "bienestar/salud-mental",
    Component: lazy(() => import("./pages/MentalHealthPage")),
    handle: { titulo: "Salud mental", regresar: "/bienestar" },
  },
];
