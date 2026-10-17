import { createContext, useContext } from "react";

export interface ContextoCampo {
  id: string;
  idAyuda?: string;
  idError?: string;
  invalido: boolean;
  requerido: boolean;
}

export const CampoContext = createContext<ContextoCampo | null>(null);

/** Une ids de aria-describedby ignorando vacíos. */
export function unirIds(...ids: Array<string | undefined | null | false>): string | undefined {
  const lista = ids.filter(Boolean).join(" ").trim();
  return lista || undefined;
}

/**
 * Atributos de accesibilidad para un control dentro de <Field>: id, aria-describedby (ayuda,
 * error y los propios), aria-invalid y aria-required. Fuera de <Field> devuelve lo recibido.
 */
export function useCampo(propios: { id?: string; describedBy?: string; invalido?: boolean; requerido?: boolean } = {}) {
  const contexto = useContext(CampoContext);
  const invalido = propios.invalido ?? contexto?.invalido ?? false;
  return {
    id: propios.id ?? contexto?.id,
    "aria-describedby": unirIds(contexto?.idAyuda, contexto?.invalido ? contexto.idError : undefined, propios.describedBy),
    "aria-invalid": invalido || undefined,
    "aria-required": (propios.requerido ?? contexto?.requerido) || undefined,
  };
}
