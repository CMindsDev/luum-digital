import { lazy } from "react";
import type { RouteObject } from "react-router";
import { msg } from "@/i18n";

/**
 * Módulo «Reportes y Bache a la vista» (brief §10; recorridos B y C). Cada pantalla carga en
 * diferido. `handle` conserva título y destino de regreso para el AppShell.
 */
export const routes: RouteObject[] = [
  { path: "reportes", Component: lazy(() => import("./pages/ReportsHubPage")), handle: { titulo: msg("Reportes") } },
  {
    path: "reportes/nuevo/:categoria",
    Component: lazy(() => import("./pages/NewReportPage")),
    handle: { titulo: msg("Nuevo reporte"), regresar: "/reportes" },
  },
  {
    path: "reportes/mis-reportes",
    Component: lazy(() => import("./pages/MyReportsPage")),
    handle: { titulo: msg("Mis reportes"), regresar: "/reportes" },
  },
  {
    path: "reportes/:reporteId",
    Component: lazy(() => import("./pages/ReportDetailPage")),
    handle: { titulo: msg("Detalle del reporte"), regresar: "/reportes/mis-reportes" },
  },
];
