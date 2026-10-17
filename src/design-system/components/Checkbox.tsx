import { CircleAlert } from "lucide-react";
import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { unirIds } from "../lib/campo";
import { cx } from "../lib/cx";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  etiqueta: ReactNode;
  descripcion?: ReactNode;
  error?: string;
  ref?: Ref<HTMLInputElement>;
}

/** Casilla nativa con etiqueta clicable (≥ 44 px), descripción y error asociados. Compatible con register(). */
export function Checkbox({ etiqueta, descripcion, error, id, className, "aria-describedby": describedBy, ref, ...resto }: CheckboxProps) {
  const base = useId().replace(/:/g, "");
  const idControl = id ?? `casilla-${base}`;
  const idDescripcion = descripcion ? `${idControl}-descripcion` : undefined;
  const idError = error ? `${idControl}-error` : undefined;
  return (
    <div className={className}>
      <div className="flex min-h-11 items-start gap-3 py-1.5">
        <input
          ref={ref}
          id={idControl}
          type="checkbox"
          aria-describedby={unirIds(idDescripcion, idError, describedBy)}
          aria-invalid={error ? true : undefined}
          className={cx("mt-0.5 size-5 shrink-0 cursor-pointer accent-marino", error && "outline-2 outline-peligro")}
          {...resto}
        />
        <div className="min-w-0">
          <label htmlFor={idControl} className="cursor-pointer font-medium text-tinta">
            {etiqueta}
          </label>
          {descripcion ? (
            <p id={idDescripcion} className="mt-0.5 text-sm text-tinta-suave">
              {descripcion}
            </p>
          ) : null}
        </div>
      </div>
      {error ? (
        <p id={idError} className="flex items-start gap-1.5 text-sm font-medium text-peligro">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
