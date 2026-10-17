import { lazy } from "react";
import type { RouteObject } from "react-router";

/** Mapa de operaciones y revisión de reportes/verificaciones ciudadanas. */
export const routes: RouteObject[] = [
  { path: "operador", Component: lazy(() => import("./pages/OperationsMapPage")), handle: { titulo: "Centro de operaciones" } },
  { path: "operador/revision", Component: lazy(() => import("./pages/OperatorPage")), handle: { titulo: "Operador de demostración" } },
];
