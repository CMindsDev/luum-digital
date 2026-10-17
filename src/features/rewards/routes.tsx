import { lazy } from "react";
import type { RouteObject } from "react-router";

/**
 * Módulo «Recompensas» (brief §11; recorrido F): saldo, beneficios de ejemplo con canje simulado,
 * historial de movimientos y reglas de demostración. Cada pantalla carga en diferido.
 */
export const routes: RouteObject[] = [
  {
    path: "participacion/recompensas",
    Component: lazy(() => import("./pages/RewardsPage")),
    handle: { titulo: "Recompensas", regresar: "/participacion" },
  },
  {
    path: "participacion/reglas",
    Component: lazy(() => import("./pages/RulesPage")),
    handle: { titulo: "Reglas de puntos", regresar: "/participacion" },
  },
];
