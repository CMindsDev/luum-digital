import { lazy } from "react";
import type { RouteObject } from "react-router";
import { msg } from "@/i18n";

/**
 * Módulo «Participación» (brief §11; recorrido E): reportes por verificar, mis verificaciones,
 * resumen de puntos y verificación de una reparación. Cada pantalla carga en diferido.
 */
export const routes: RouteObject[] = [
  {
    path: "participacion",
    Component: lazy(() => import("./pages/ParticipationPage")),
    handle: { titulo: msg("Participación y recompensas") },
  },
  {
    path: "participacion/verificar/:reporteId",
    Component: lazy(() => import("./pages/VerifyRepairPage")),
    handle: { titulo: msg("Verificar reparación"), regresar: "/participacion" },
  },
];
