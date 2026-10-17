import { createContext, useContext } from "react";
import type { Repositories } from "@/services/contracts";

export const RepositoriesContext = createContext<Repositories | null>(null);

/** Repositorios activos (demo o real). Úsalo sólo dentro de src/services/hooks. */
export function useRepositories(): Repositories {
  const value = useContext(RepositoriesContext);
  if (!value) throw new Error("useRepositories debe usarse dentro de <ServicesProvider>.");
  return value;
}
