import { lazy } from "react";
import type { RouteObject } from "react-router";
import { msg } from "@/i18n";

/**
 * Módulo «Recompensas» (brief §11; recorrido F): saldo, beneficios de ejemplo con canje simulado,
 * historial de movimientos y reglas de demostración. Cada pantalla carga en diferido.
 */
export const routes: RouteObject[] = [
  {
    path: "participacion/recompensas",
    Component: lazy(() => import("./pages/RewardsPage")),
    handle: { titulo: msg("Recompensas"), regresar: "/participacion" },
  },
  {
    path: "participacion/reglas",
    Component: lazy(() => import("./pages/RulesPage")),
    handle: { titulo: msg("Reglas de puntos"), regresar: "/participacion" },
  },
];
