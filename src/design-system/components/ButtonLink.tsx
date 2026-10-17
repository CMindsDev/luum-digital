import { ExternalLink, type LucideIcon } from "lucide-react";
import type { AnchorHTMLAttributes, ReactNode, Ref } from "react";
import { useTranslation } from "react-i18next";
import { Link, type LinkProps } from "react-router";
import { clasesBoton, type TamanoBoton, type VarianteBoton } from "../lib/button-styles";

interface ComunesButtonLink {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  iconoInicio?: LucideIcon;
  /** En enlaces externos, por omisión es el ícono de «enlace externo». */
  iconoFin?: LucideIcon;
  anchoCompleto?: boolean;
  className?: string;
  children: ReactNode;
  ref?: Ref<HTMLAnchorElement>;
}

/** Enlace interno con apariencia de botón (Link de react-router). */
export type ButtonLinkInternoProps = ComunesButtonLink & Omit<LinkProps, "className" | "children"> & { href?: never };

/** Enlace externo con apariencia de botón: abre otra pestaña y lo anuncia. Un enlace no es una integración. */
export type ButtonLinkExternoProps = ComunesButtonLink &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | "href"> & { href: string; to?: never };

export type ButtonLinkProps = ButtonLinkInternoProps | ButtonLinkExternoProps;

function esExterno(props: ButtonLinkProps): props is ButtonLinkExternoProps {
  return typeof props.href === "string";
}

export function ButtonLink(props: ButtonLinkProps) {
  const { t } = useTranslation();
  if (esExterno(props)) {
    const {
      variante,
      tamano,
      iconoInicio: IconoInicio,
      iconoFin: IconoFin = ExternalLink,
      anchoCompleto,
      className,
      children,
      href,
      ref,
      ...resto
    } = props;
    return (
      <a
        ref={ref}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={clasesBoton({ variante, tamano, anchoCompleto, className })}
        {...resto}
      >
        {IconoInicio ? <IconoInicio aria-hidden="true" className="size-[1.15em] shrink-0" /> : null}
        <span>{children}</span>
        <IconoFin aria-hidden="true" className="size-[1.05em] shrink-0" />
        <span className="sr-only">{t("(se abre en otra pestaña)")}</span>
      </a>
    );
  }
  const { variante, tamano, iconoInicio: IconoInicio, iconoFin: IconoFin, anchoCompleto, className, children, ref, ...resto } = props;
  return (
    <Link ref={ref} className={clasesBoton({ variante, tamano, anchoCompleto, className })} {...resto}>
      {IconoInicio ? <IconoInicio aria-hidden="true" className="size-[1.15em] shrink-0" /> : null}
      <span>{children}</span>
      {IconoFin ? <IconoFin aria-hidden="true" className="size-[1.15em] shrink-0" /> : null}
    </Link>
  );
}
