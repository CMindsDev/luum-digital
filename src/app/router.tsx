import { createBrowserRouter, type RouteObject } from "react-router";
import { routes as accountRoutes } from "@/features/account/routes";
import { routes as demoOperatorRoutes } from "@/features/demo-operator/routes";
import { routes as digitalFileRoutes } from "@/features/digital-file/routes";
import { routes as homeRoutes } from "@/features/home/routes";
import { routes as mapRoutes } from "@/features/map/routes";
import { routes as mentalHealthRoutes } from "@/features/mental-health/routes";
import { routes as notificationsRoutes } from "@/features/notifications/routes";
import { routes as participationRoutes } from "@/features/participation/routes";
import { routes as proceduresRoutes } from "@/features/procedures/routes";
import { routes as reportsRoutes } from "@/features/reports/routes";
import { routes as rewardsRoutes } from "@/features/rewards/routes";
import { routes as servicesRoutes } from "@/features/services/routes";
import { routes as wellbeingRoutes } from "@/features/wellbeing/routes";
import { routes as womenSupportRoutes } from "@/features/women-support/routes";
import { AppShell } from "./shell/AppShell";
import { PaginaError } from "./shell/PaginaError";
import { PaginaNoEncontrada } from "./shell/PaginaNoEncontrada";

/** Rutas de los módulos, relativas al layout del AppShell (cada módulo carga en diferido). */
export const rutasDeModulos: RouteObject[] = [
  ...homeRoutes,
  ...servicesRoutes,
  ...proceduresRoutes,
  ...notificationsRoutes,
  ...reportsRoutes,
  ...mapRoutes,
  ...participationRoutes,
  ...rewardsRoutes,
  ...wellbeingRoutes,
  ...mentalHealthRoutes,
  ...womenSupportRoutes,
  ...digitalFileRoutes,
  ...demoOperatorRoutes,
  ...accountRoutes,
];

export const rutas: RouteObject[] = [
  {
    path: "/",
    element: <AppShell />,
    // Si falla el propio AppShell: error con el rótulo de demostración.
    errorElement: <PaginaError fueraDelShell />,
    children: [
      {
        // Los errores de una pantalla se muestran dentro del AppShell (la navegación sigue disponible).
        errorElement: <PaginaError />,
        children: [...rutasDeModulos, { path: "*", element: <PaginaNoEncontrada /> }],
      },
    ],
  },
];

export function crearRouter() {
  return createBrowserRouter(rutas);
}
