import { lazy } from "react";
import type { RouteObject } from "react-router";

/** «Mis gestiones»: seguimiento de gestiones simuladas (carga diferida por pantalla). */
export const routes: RouteObject[] = [
  { path: "gestiones", Component: lazy(() => import("./pages/ProceduresPage")), handle: { titulo: "Mis gestiones" } },
  {
    path: "gestiones/:gestionId",
    Component: lazy(() => import("./pages/ProcedureDetailPage")),
    handle: { titulo: "Detalle de la gestión", regresar: "/gestiones" },
  },
];
