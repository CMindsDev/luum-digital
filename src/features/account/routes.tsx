import { lazy } from "react";
import type { RouteObject } from "react-router";

export const routes: RouteObject[] = [{ path: "cuenta", Component: lazy(() => import("./pages/AccountPage")) }];
