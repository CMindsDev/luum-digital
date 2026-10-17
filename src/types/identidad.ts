import type { AmbitoOperacion } from "./operaciones";

/**
 * Identidades ficticias de la demostración. No representan autenticación municipal:
 * la "cuenta compartida" es una capacidad del prototipo (ver docs/INTEGRACIONES.md).
 */

export type Rol =
  /** Persona ciudadana: reporta, verifica, consulta su expediente ficticio. */
  | "ciudadania"
  /** Persona funcionaria de demostración: valida reportes, registra atención, revisa verificaciones. */
  | "operador"
  /** Administración de demostración: además ve demanda agregada y reglas de puntos. */
  | "administracion";

export interface IdentidadDemo {
  id: string;
  /** Nombre ficticio. */
  nombre: string;
  iniciales: string;
  rol: Rol;
  /** Texto corto para el selector de identidad. */
  descripcion: string;
  /**
   * Ámbito en el Centro de operaciones (sólo operador/administración). Sin valor en esos roles
   * equivale a coordinación (ve todos los sectores).
   */
  ambito?: AmbitoOperacion;
}
