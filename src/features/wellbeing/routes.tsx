import { lazy } from "react";
import type { RouteObject } from "react-router";
import { msg } from "@/i18n";

/** Bienestar (carga diferida). Salud mental y Línea Mujer tienen sus propios módulos. */
export const routes: RouteObject[] = [
  { path: "bienestar", Component: lazy(() => import("./pages/WellbeingPage")), handle: { titulo: msg("Bienestar") } },
];
