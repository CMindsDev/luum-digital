import { lazy } from "react";
import type { RouteObject } from "react-router";

/**
 * Módulo «Participación» (brief §11; recorrido E): reportes por verificar, mis verificaciones,
 * resumen de puntos y verificación de una reparación. Cada pantalla carga en diferido.
 */
export const routes: RouteObject[] = [
  { path: "participacion", Component: lazy(() => import("./pages/ParticipationPage")), handle: { titulo: "Participación y recompensas" } },
  {
    path: "participacion/verificar/:reporteId",
    Component: lazy(() => import("./pages/VerifyRepairPage")),
    handle: { titulo: "Verificar reparación", regresar: "/participacion" },
  },
];
