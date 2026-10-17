import { lazy } from "react";
import type { RouteObject } from "react-router";

/**
 * Expediente Digital de ejemplo (carga diferida por pantalla). Perfil y documentos ficticios
 * («DOCUMENTO DE EJEMPLO»); la reutilización de datos siempre pide confirmación campo por campo.
 */
export const routes: RouteObject[] = [
  { path: "expediente", Component: lazy(() => import("./pages/ExpedientePage")), handle: { titulo: "Mi expediente" } },
  {
    path: "expediente/documentos/:documentoId",
    Component: lazy(() => import("./pages/DocumentoPage")),
    handle: { titulo: "Documento de ejemplo", regresar: "/expediente" },
  },
];
