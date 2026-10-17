import { useMemo, type ReactNode } from "react";
import type { Repositories } from "@/services/contracts";
import { createRepositories } from "@/services/registry";
import { RepositoriesContext } from "@/services/repositories-context";

/**
 * Provee los repositorios elegidos por el registro (demo o real). En pruebas se pueden inyectar
 * repositorios propios con la prop `repositories`.
 */
export function ServicesProvider({ children, repositories }: { children: ReactNode; repositories?: Repositories }) {
  const value = useMemo(() => repositories ?? createRepositories(), [repositories]);
  return <RepositoriesContext.Provider value={value}>{children}</RepositoriesContext.Provider>;
}
