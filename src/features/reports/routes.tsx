import { lazy } from "react";
import type { RouteObject } from "react-router";

/**
 * Módulo «Reportes y Bache a la vista» (brief §10; recorridos B y C). Cada pantalla carga en
 * diferido. `handle` conserva título y destino de regreso para el AppShell.
 */
export const routes: RouteObject[] = [
  { path: "reportes", Component: lazy(() => import("./pages/ReportsHubPage")), handle: { titulo: "Reportes" } },
  {
    path: "reportes/nuevo/:categoria",
    Component: lazy(() => import("./pages/NewReportPage")),
    handle: { titulo: "Nuevo reporte", regresar: "/reportes" },
  },
  {
    path: "reportes/mis-reportes",
    Component: lazy(() => import("./pages/MyReportsPage")),
    handle: { titulo: "Mis reportes", regresar: "/reportes" },
  },
  {
    path: "reportes/:reporteId",
    Component: lazy(() => import("./pages/ReportDetailPage")),
    handle: { titulo: "Detalle del reporte", regresar: "/reportes/mis-reportes" },
  },
];
