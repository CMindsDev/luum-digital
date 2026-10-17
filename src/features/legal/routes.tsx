import { lazy } from "react";
import type { RouteObject } from "react-router";
export const routes: RouteObject[] = [{
  path: "legal/:documento",
  Component: lazy(() => import("./pages/DocumentoLegalPage")),
  handle: { titulo: "Información legal" },
}];
