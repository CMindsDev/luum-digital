import type { LucideIcon } from "lucide-react";
import type { InputHTMLAttributes, Ref } from "react";
import { useCampo } from "../lib/campo";
import { cx } from "../lib/cx";

export const CLASES_CONTROL =
  "w-full rounded-control border border-borde-control bg-superficie px-3.5 text-base text-tinta placeholder:text-tinta-suave " +
  "transition-[border-color,box-shadow] duration-(--duracion-rapida) ease-suave hover:border-marino " +
  "disabled:cursor-not-allowed disabled:bg-superficie-2 disabled:opacity-70 " +
  "aria-invalid:border-peligro aria-invalid:border-2";

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Ícono decorativo a la izquierda. */
  icono?: LucideIcon;
  ref?: Ref<HTMLInputElement>;
}

/** Campo de texto de 48 px. Dentro de <Field> recibe id, aria-describedby y aria-invalid. Compatible con register() de React Hook Form. */
export function TextInput({ icono: Icono, className, id, "aria-describedby": describedBy, "aria-invalid": ariaInvalid, required, ref, ...resto }: TextInputProps) {
  const campo = useCampo({ id, describedBy, invalido: ariaInvalid === true || ariaInvalid === "true" ? true : undefined, requerido: required });
  return (
    <div className="relative">
      {Icono ? <Icono aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-tinta-suave" /> : null}
      <input ref={ref} required={required} {...campo} {...resto} className={cx(CLASES_CONTROL, "h-12", Icono && "pl-11", className)} />
    </div>
  );
}
