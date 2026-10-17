import { lazy } from "react";
import type { RouteObject } from "react-router";

/** Inicio y búsqueda global en lenguaje natural (brief §8). Carga diferida por pantalla. */
export const routes: RouteObject[] = [
  { index: true, Component: lazy(() => import("./pages/HomePage")) },
  { path: "buscar", Component: lazy(() => import("./pages/SearchPage")) },
];
