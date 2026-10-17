import { createContext, useContext } from "react";

/** Datos que Field comparte con su control (TextInput, TextArea, Select…). */
export interface ContextoCampo {
  id: string;
  /** ids de ayuda y error, separados por espacio, para aria-describedby. */
  describedBy: string | undefined;
  invalido: boolean;
  requerido: boolean;
  idError: string;
  idAyuda: string;
}

export const CampoContext = createContext<ContextoCampo | null>(null);

/** Lee el contexto del Field contenedor (o null si el control se usa solo). */
export function useCampo(): ContextoCampo | null {
  return useContext(CampoContext);
}

/** Une varios ids de aria-describedby ignorando vacíos. */
export function unirIds(...ids: Array<string | undefined | null | false>): string | undefined {
  const unidos = ids.filter(Boolean).join(" ");
  return unidos.length > 0 ? unidos : undefined;
}
