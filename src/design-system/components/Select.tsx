import { ChevronDown } from "lucide-react";
import type { Ref, SelectHTMLAttributes } from "react";
import { useCampo } from "../lib/campo";
import { cx } from "../lib/cx";
import { CLASES_CONTROL } from "./TextInput";

export interface OpcionSelect {
  valor: string;
  etiqueta: string;
  deshabilitada?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Opciones; también puedes pasar <option> como children. */
  opciones?: OpcionSelect[];
  /** Primera opción vacía (p. ej. «Elige una opción»). */
  marcador?: string;
  ref?: Ref<HTMLSelectElement>;
}

/** Lista desplegable nativa (accesible en móvil y con teclado). */
export function Select({ opciones, marcador, className, children, id, "aria-describedby": describedBy, "aria-invalid": ariaInvalid, required, ref, ...resto }: SelectProps) {
  const campo = useCampo({ id, describedBy, invalido: ariaInvalid === true || ariaInvalid === "true" ? true : undefined, requerido: required });
  return (
    <div className="relative">
      <select ref={ref} required={required} {...campo} {...resto} className={cx(CLASES_CONTROL, "h-12 appearance-none pr-11", className)}>
        {marcador ? <option value="">{marcador}</option> : null}
        {opciones?.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor} disabled={opcion.deshabilitada}>
            {opcion.etiqueta}
          </option>
        ))}
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 size-5 -translate-y-1/2 text-tinta-suave" />
    </div>
  );
}
