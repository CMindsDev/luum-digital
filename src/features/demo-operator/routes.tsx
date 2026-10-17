import { lazy } from "react";
import type { RouteObject } from "react-router";

/**
 * Marcador de F1 (carga diferida con React.lazy). El módulo «demo-operator» reemplaza estas rutas.
 * Patrón: `Component: lazy(() => import("./pages/MiPantalla"))` dentro del objeto de ruta (así
 * el archivo no declara componentes locales y cumple react-refresh/only-export-components).
 */
export const routes: RouteObject[] = [
  { path: "operador", Component: lazy(() => import("./pages/PlaceholderPage")), handle: { titulo: "Operador de demostración" } },
];
