import type { Repositories } from "@/services/contracts";
import { crearRepositoriosDemo } from "@/services/adapters/demo";
import { crearRepositoriosHttp } from "@/services/adapters/http";

export type ModoIntegracion = "demo" | "real";

/** Modo configurado con VITE_INTEGRATION_MODE (por defecto "demo"). */
export function modoIntegracionConfigurado(): ModoIntegracion {
  return import.meta.env.VITE_INTEGRATION_MODE === "real" ? "real" : "demo";
}

/**
 * Crea los repositorios del modo indicado.
 * - demo: simulación local con datos ficticios.
 * - real: adaptadores http; mientras no exista una integración autorizada, cada llamada falla con
 *   IntegracionNoDisponibleError y la interfaz lo muestra como error explícito.
 */
export function createRepositories(modo: ModoIntegracion = modoIntegracionConfigurado()): Repositories {
  return modo === "real" ? crearRepositoriosHttp() : crearRepositoriosDemo();
}
