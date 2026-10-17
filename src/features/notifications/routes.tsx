import { lazy } from "react";
import type { RouteObject } from "react-router";
import { msg } from "@/i18n";

/** Notificaciones simuladas de la identidad activa (carga diferida). */
export const routes: RouteObject[] = [
  { path: "notificaciones", Component: lazy(() => import("./pages/NotificationsPage")), handle: { titulo: msg("Notificaciones") } },
];
