import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, Ref } from "react";
import { Link, type LinkProps } from "react-router";
import { clasesBotonIcono, type TamanoBotonIcono, type VarianteBotonIcono } from "../lib/button-styles";

interface ComunesIconButton {
  /** Nombre accesible obligatorio (se usa como aria-label y como title). */
  etiqueta: string;
  icono: LucideIcon;
  variante?: VarianteBotonIcono;
  tamano?: TamanoBotonIcono;
  /** Conteo pequeño sobre el ícono (p. ej. notificaciones sin leer). 0 o undefined lo oculta. */
  insignia?: number;
  className?: string;
}

export interface IconButtonProps
  extends ComunesIconButton,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-label" | "className"> {
  ref?: Ref<HTMLButtonElement>;
}

function Insignia({ valor }: { valor?: number }) {
  if (!valor) return null;
  return (
    <span
      aria-hidden="true"
      className="absolute -top-0.5 -right-0.5 inline-flex min-w-5 items-center justify-center rounded-pildora bg-lima-logo px-1 text-[0.6875rem] leading-5 font-bold text-marino ring-2 ring-marino"
    >
      {valor > 99 ? "99+" : valor}
    </span>
  );
}

/** Botón de sólo ícono con nombre accesible obligatorio y objetivo táctil de 44 px o más. */
export function IconButton({
  etiqueta,
  icono: Icono,
  variante,
  tamano,
  insignia,
  className,
  type = "button",
  ref,
  ...resto
}: IconButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={etiqueta}
      title={etiqueta}
      className={clasesBotonIcono({ variante, tamano, className })}
      {...resto}
    >
      <Icono aria-hidden="true" className="size-5" />
      <Insignia valor={insignia} />
    </button>
  );
}

export type IconButtonLinkProps = ComunesIconButton &
  Omit<LinkProps, "children" | "className" | "aria-label"> & { ref?: Ref<HTMLAnchorElement> };

/** Enlace interno de sólo ícono (p. ej. la campana de notificaciones). */
export function IconButtonLink({ etiqueta, icono: Icono, variante, tamano, insignia, className, ref, ...resto }: IconButtonLinkProps) {
  return (
    <Link ref={ref} aria-label={etiqueta} title={etiqueta} className={clasesBotonIcono({ variante, tamano, className })} {...resto}>
      <Icono aria-hidden="true" className="size-5" />
      <Insignia valor={insignia} />
    </Link>
  );
}
