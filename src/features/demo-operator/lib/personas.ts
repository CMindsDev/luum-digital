import { buscarIdentidad } from "@/app/session/store";

/**
 * Nombre visible de quien envió un reporte o una verificación. Las identidades activas de la demo
 * tienen nombre ficticio; el resto de la vecindad ficticia se muestra sin nombre.
 */
export function nombrePersona(identidadId: string): string {
  const identidad = buscarIdentidad(identidadId);
  return identidad.id === identidadId ? `${identidad.nombre} (identidad ficticia)` : "Persona vecina (ficticia)";
}
