import type { IdentidadDemo } from "@/types";

/**
 * Identidades ficticias de la demostración. Cualquier parecido con personas reales es coincidencia.
 * Los ids son estables: las semillas (reportes, expediente, puntos) los referencian.
 */
export const IDENTIDADES_DEMO: readonly IdentidadDemo[] = [
  { id: "ana", nombre: "Ana Ek", iniciales: "AE", rol: "ciudadania", descripcion: "Ciudadana ficticia" },
  { id: "bruno", nombre: "Bruno Canul", iniciales: "BC", rol: "ciudadania", descripcion: "Ciudadano ficticio" },
  { id: "operador", nombre: "Carmen Dzib", iniciales: "CD", rol: "operador", descripcion: "Operadora de demostración" },
  { id: "admin", nombre: "Administración demo", iniciales: "AD", rol: "administracion", descripcion: "Administración de demostración" },
] as const;

export const IDENTIDAD_INICIAL_ID = "ana";
