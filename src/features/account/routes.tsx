import { lazy } from "react";
import type { RouteObject } from "react-router";
import { msg } from "@/i18n";

export const routes: RouteObject[] = [{ path: "cuenta", Component: lazy(() => import("./pages/AccountPage")), handle: { titulo: msg("Cuenta de demostración") } }];
