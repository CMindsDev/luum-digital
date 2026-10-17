/** Entrada del registro de acciones de la visita (sólo en memoria; los cambios sí quedan en los datos de la demo). */
export interface AccionRegistrada {
  id: string;
  texto: string;
  fecha: string;
  enlace?: { to: string; etiqueta: string };
}

export type RegistrarAccion = (accion: Omit<AccionRegistrada, "id" | "fecha">) => void;
