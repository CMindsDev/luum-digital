import { QueryClient } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { createMemoryRouter, RouterProvider, type RouteObject } from "react-router";
import { AppProviders } from "@/app/providers";
import type { Repositories } from "@/services/contracts";

export interface OpcionesRender extends Omit<RenderOptions, "wrapper"> {
  /** Ruta inicial del router en memoria. */
  ruta?: string;
  /** Patrón de ruta del elemento (p. ej. "/reportes/:reporteId"); por omisión "*". */
  patron?: string;
  /** Rutas adicionales (p. ej. destinos de navegación). */
  rutasExtra?: RouteObject[];
  /** Repositorios propios (si no, los del registro). */
  repositories?: Repositories;
  queryClient?: QueryClient;
}

/** QueryClient de pruebas: sin reintentos ni caché persistente entre pruebas. */
export function crearQueryClientDePrueba(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: 0, networkMode: "always" },
      mutations: { retry: false, networkMode: "always" },
    },
  });
}

/**
 * Renderiza con los mismos proveedores de la app (TanStack Query, servicios, MotionConfig) y un
 * router en memoria. Devuelve además `user` (userEvent) y el `queryClient`.
 */
export function renderWithProviders(ui: ReactElement, opciones: OpcionesRender = {}) {
  const { ruta = "/", patron = "*", rutasExtra = [], repositories, queryClient = crearQueryClientDePrueba(), ...resto } = opciones;
  const router = createMemoryRouter([{ path: patron, element: ui }, ...rutasExtra], { initialEntries: [ruta] });
  const user = userEvent.setup();
  const resultado = render(
    <AppProviders repositories={repositories} queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
    resto,
  );
  return { ...resultado, user, router, queryClient };
}
