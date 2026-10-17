import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { useState, type ReactNode } from "react";
import { esErrorDefinitivo } from "@/design-system";
import type { Repositories } from "@/services/contracts";
import { createRepositories } from "@/services/registry";
import { ServicesProvider } from "@/services/ServicesProvider";

/** Un reintento, salvo errores definitivos (reglas de negocio, permisos, integración no disponible, no encontrado) o sin conexión. */
function debeReintentar(intentos: number, error: unknown): boolean {
  if (intentos >= 1) return false;
  if (esErrorDefinitivo(error)) return false;
  return !(error instanceof Error && error.name === "SinConexionError");
}

function crearQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: debeReintentar,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Los adaptadores demo son locales: lanzan SinConexionError en vez de quedar en pausa.
        networkMode: "always",
      },
      mutations: { retry: false, networkMode: "always" },
    },
  });
}

/**
 * Proveedores globales: TanStack Query, repositorios (ServicesProvider: demo o real según
 * VITE_INTEGRATION_MODE) y MotionConfig (respeta «reducir movimiento» del sistema).
 * En pruebas se pueden inyectar `repositories` y `queryClient`.
 */
export function AppProviders({
  children,
  repositories,
  queryClient,
}: {
  children: ReactNode;
  repositories?: Repositories;
  queryClient?: QueryClient;
}) {
  const [clientePropio] = useState(crearQueryClient);
  const [repositoriosPropios] = useState(() => repositories ?? createRepositories());

  return (
    <QueryClientProvider client={queryClient ?? clientePropio}>
      <ServicesProvider repositories={repositoriosPropios}>
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </ServicesProvider>
    </QueryClientProvider>
  );
}
