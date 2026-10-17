import type { CoberturaCatalogo, Servicio } from "@/types";
import cobertura from "./cobertura.generated.json";
import serviciosGenerados from "./servicios.generated.json";
import { SERVICIOS_MANUALES } from "./servicios-manuales";

/**
 * Catálogo integrado del prototipo: fichas generadas desde el Portal Ciudadano
 * (npm run catalogo:importar) más los módulos manuales con su fuente.
 * Sólo lo importa el adaptador demo del catálogo (con import dinámico para no cargarlo al inicio).
 */

function comoServicios(datos: unknown): Servicio[] {
  if (!Array.isArray(datos)) throw new Error("El catálogo generado no es una lista.");
  return datos as Servicio[];
}

function comoCobertura(datos: unknown): CoberturaCatalogo {
  if (typeof datos !== "object" || datos === null || !("totalFuente" in datos)) {
    throw new Error("La cobertura generada no tiene el formato esperado.");
  }
  return datos as CoberturaCatalogo;
}

export const SERVICIOS_IMPORTADOS: readonly Servicio[] = comoServicios(serviciosGenerados);

export const SERVICIOS: readonly Servicio[] = [...SERVICIOS_MANUALES, ...SERVICIOS_IMPORTADOS];

export const COBERTURA_IMPORTACION: CoberturaCatalogo = comoCobertura(cobertura);

export { SERVICIOS_MANUALES };
