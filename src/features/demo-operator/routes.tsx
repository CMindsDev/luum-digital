import { lazy } from "react";
import type { RouteObject } from "react-router";

/**
 * Módulo «Operador de demostración» (brief §11; recorridos D y E): cola con prioridad por criterios
 * explícitos, validar, registrar atención, cancelar con motivo y revisión de verificaciones.
 */
export const routes: RouteObject[] = [
  { path: "operador", Component: lazy(() => import("./pages/OperatorPage")), handle: { titulo: "Operador de demostración" } },
];
