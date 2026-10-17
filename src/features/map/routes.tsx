import { lazy } from "react";
import type { RouteObject } from "react-router";

/** Mapa / Visor Urbano (carga diferida; el motor del mapa se descarga aparte, sólo al mostrarlo). */
export const routes: RouteObject[] = [
  { path: "mapa", Component: lazy(() => import("./pages/VisorPage")), handle: { titulo: "Mapa / Visor Urbano" } },
];
