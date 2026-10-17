import { lazy } from "react";
import type { RouteObject } from "react-router";

/**
 * Catálogo Municipal (carga diferida por pantalla). Las fichas, categorías y recorridos son datos:
 * para agregar un servicio no se crean componentes (AGENTS.md §6).
 */
export const routes: RouteObject[] = [
  { path: "servicios", Component: lazy(() => import("./pages/CatalogPage")), handle: { titulo: "Trámites y servicios" } },
  {
    path: "servicios/categoria/:categoriaId",
    Component: lazy(() => import("./pages/CategoryPage")),
    handle: { titulo: "Categoría de servicios", regresar: "/servicios" },
  },
  {
    path: "servicios/:servicioId",
    Component: lazy(() => import("./pages/ServiceDetailPage")),
    handle: { titulo: "Ficha del servicio", regresar: "/servicios" },
  },
  {
    path: "servicios/:servicioId/iniciar",
    Component: lazy(() => import("./pages/StartServicePage")),
    handle: { titulo: "Iniciar trámite", regresar: "/servicios" },
  },
];
