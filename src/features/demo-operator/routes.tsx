import { lazy } from "react";
import type { RouteObject } from "react-router";
import { msg } from "@/i18n";

/** Mapa de operaciones y revisión de reportes/verificaciones ciudadanas. */
export const routes: RouteObject[] = [
  { path: "operador", Component: lazy(() => import("./pages/OperationsMapPage")), handle: { titulo: msg("Centro de operaciones") } },
  { path: "operador/revision", Component: lazy(() => import("./pages/OperatorPage")), handle: { titulo: msg("Operador de demostración") } },
];
