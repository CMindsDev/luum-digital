import { lazy } from "react";
import type { RouteObject } from "react-router";

/** Centro de operaciones con mapa, atención de casos y análisis por área. */
export const routes: RouteObject[] = [
  { path: "operador", Component: lazy(() => import("./pages/OperatorPage")), handle: { titulo: "Centro de operaciones" } },
];
