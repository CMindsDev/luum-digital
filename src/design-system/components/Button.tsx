import { LoaderCircle, type LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, Ref } from "react";
import { clasesBoton, type TamanoBoton, type VarianteBoton } from "../lib/button-styles";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primario (marino), secundario (contorno), fantasma, exito, peligro o acento (lima del logotipo). */
  variante?: VarianteBoton;
  /** sm 44 px, md 48 px, lg 56 px de alto. */
  tamano?: TamanoBoton;
  /** Muestra un indicador, marca aria-busy y deshabilita el botón (evita dobles envíos). */
  cargando?: boolean;
  /** Texto mientras carga (p. ej. «Enviando…»). Si no se da, se conserva el texto del botón. */
  textoCargando?: string;
  iconoInicio?: LucideIcon;
  iconoFin?: LucideIcon;
  anchoCompleto?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variante = "primario",
  tamano = "md",
  cargando = false,
  textoCargando,
  iconoInicio: IconoInicio,
  iconoFin: IconoFin,
  anchoCompleto = false,
  className,
  children,
  disabled,
  type = "button",
  ref,
  ...resto
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={clasesBoton({ variante, tamano, anchoCompleto, className })}
      {...resto}
    >
      {cargando ? (
        <LoaderCircle aria-hidden="true" className="size-[1.15em] shrink-0 motion-safe:animate-spin" />
      ) : IconoInicio ? (
        <IconoInicio aria-hidden="true" className="size-[1.15em] shrink-0" />
      ) : null}
      <span>{cargando && textoCargando ? textoCargando : children}</span>
      {IconoFin && !cargando ? <IconoFin aria-hidden="true" className="size-[1.15em] shrink-0" /> : null}
    </button>
  );
}
