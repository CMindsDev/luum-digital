import { CircleAlert } from "lucide-react";
import { useId, useMemo, type ReactNode } from "react";
import { CampoContext, type ContextoCampo } from "../lib/campo";
import { cx } from "../lib/cx";

export interface FieldProps {
  etiqueta: ReactNode;
  /** Texto de ayuda (se asocia con aria-describedby). */
  ayuda?: ReactNode;
  /** Mensaje de error (activa aria-invalid y se asocia con aria-describedby). */
  error?: string;
  requerido?: boolean;
  /** Muestra «(opcional)» junto a la etiqueta. */
  opcional?: boolean;
  /** Id del control; si no se da se genera. */
  id?: string;
  /** Oculta visualmente la etiqueta (sigue disponible para lectores de pantalla). */
  ocultarEtiqueta?: boolean;
  /** Control: TextInput, TextArea, Select o cualquier control que use useCampo(). */
  children: ReactNode;
  className?: string;
}

/**
 * Campo de formulario: <label> + ayuda + error asociados al control hijo mediante contexto
 * (id, aria-describedby, aria-invalid, aria-required).
 */
export function Field({ etiqueta, ayuda, error, requerido = false, opcional = false, id, ocultarEtiqueta = false, children, className }: FieldProps) {
  const generado = useId();
  const idControl = id ?? `campo-${generado.replace(/:/g, "")}`;
  const idAyuda = ayuda ? `${idControl}-ayuda` : undefined;
  const idError = error ? `${idControl}-error` : undefined;
  const valor = useMemo<ContextoCampo>(
    () => ({ id: idControl, idAyuda, idError, invalido: Boolean(error), requerido }),
    [idControl, idAyuda, idError, error, requerido],
  );

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={idControl} className={cx("text-[0.9375rem] font-semibold text-tinta", ocultarEtiqueta && "sr-only")}>
        {etiqueta}
        {requerido ? (
          <span className="text-peligro">
            <span aria-hidden="true"> *</span>
            <span className="sr-only"> (obligatorio)</span>
          </span>
        ) : null}
        {opcional ? <span className="font-normal text-tinta-suave"> (opcional)</span> : null}
      </label>
      {ayuda ? (
        <p id={idAyuda} className="text-sm text-tinta-suave">
          {ayuda}
        </p>
      ) : null}
      <CampoContext.Provider value={valor}>{children}</CampoContext.Provider>
      {error ? (
        <p id={idError} className="flex items-start gap-1.5 text-sm font-medium text-peligro">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
