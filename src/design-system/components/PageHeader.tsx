import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { cx } from "../lib/cx";
import { GlifoPixel } from "./GlifoPixel";
import { PatronCadena } from "./PatronCadena";

export interface PageHeaderProps {
  /** Título de la pantalla: es el único h1. */
  titulo: string;
  descripcion?: ReactNode;
  /** Texto pequeño sobre el título (p. ej. la sección). */
  antetitulo?: string;
  /**
   * Botón regresar: una ruta (Link) o true para volver al historial (con respaldo a "/").
   * Estilo Mérida Móvil: cuadrado redondeado a la izquierda del título.
   */
  regresar?: string | boolean;
  etiquetaRegresar?: string;
  /** Acción opcional a la derecha (p. ej. un IconButton o Button). */
  accion?: ReactNode;
  /** Encabezado destacado con el banner del Laboratorio (glifo y cadena decorativos). */
  destacado?: boolean;
  /** Contenido adicional bajo el título (insignias, chips…). */
  children?: ReactNode;
  className?: string;
}

const CLASES_REGRESAR =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-boton border border-borde bg-superficie text-marino shadow-suave transition-colors hover:bg-marino-suave";

function BotonRegresar({ regresar, etiqueta }: { regresar: string | true; etiqueta: string }) {
  const navigate = useNavigate();
  if (typeof regresar === "string") {
    return (
      <Link to={regresar} aria-label={etiqueta} title={etiqueta} className={CLASES_REGRESAR}>
        <ArrowLeft aria-hidden="true" className="size-5" />
      </Link>
    );
  }
  const volver = () => {
    const indice = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (indice > 0) navigate(-1);
    else navigate("/");
  };
  return (
    <button type="button" onClick={volver} aria-label={etiqueta} title={etiqueta} className={CLASES_REGRESAR}>
      <ArrowLeft aria-hidden="true" className="size-5" />
    </button>
  );
}

/**
 * Encabezado de pantalla: regresar + h1 + acción. El h1 recibe el foco al cambiar de ruta
 * (tabIndex -1; lo gestiona el AppShell).
 */
export function PageHeader({
  titulo,
  descripcion,
  antetitulo,
  regresar,
  etiquetaRegresar,
  accion,
  destacado = false,
  children,
  className,
}: PageHeaderProps) {
  const { t } = useTranslation();
  const cabecera = (
    <div className="flex items-start gap-3">
      {regresar ? <BotonRegresar regresar={regresar} etiqueta={etiquetaRegresar ?? t("Regresar")} /> : null}
      <div className="min-w-0 flex-1">
        {antetitulo ? (
          <p className="mb-1.5 font-mono-rotulo text-xs font-medium tracking-rotulo text-tinta-suave uppercase">{antetitulo}</p>
        ) : null}
        <h1 tabIndex={-1} className="text-2xl leading-tight font-bold tracking-[-0.03em] text-marino sm:text-[1.75rem] lg:text-[2rem]">
          {titulo}
        </h1>
        {descripcion ? <div className="mt-2 max-w-prose text-[0.9375rem] text-tinta-suave sm:text-base">{descripcion}</div> : null}
      </div>
      {accion ? <div className="flex shrink-0 items-center gap-2">{accion}</div> : null}
    </div>
  );

  if (!destacado) {
    return (
      <header className={cx("mb-6", className)}>
        {cabecera}
        {children ? <div className="mt-4">{children}</div> : null}
      </header>
    );
  }

  /*
   * Banner del Laboratorio (22:1356): el texto va SIEMPRE sobre crema (tinta-suave 6.47:1). El degradado
   * crema → azul ocupa el tercio derecho en tableta y escritorio y una franja inferior en móvil, donde
   * van el glifo y el patrón de cadena en crema (decorativos).
   */
  return (
    <header className={cx("relative mb-6 overflow-hidden rounded-tarjeta border border-borde bg-fondo p-5 pb-14 sm:p-7", className)}>
      <div aria-hidden="true" className="absolute inset-y-0 right-0 hidden w-[38%] bg-linear-to-r from-fondo to-azul sm:block" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-10 bg-degradado-banner sm:hidden" />
      <div className="relative z-10 sm:max-w-[min(38rem,62%)]">{cabecera}</div>
      {children ? <div className="relative z-10 mt-4">{children}</div> : null}
      <GlifoPixel tamano={56} className="absolute top-4 right-5 hidden text-crema sm:block" />
      <PatronCadena alto={26} className="absolute right-4 bottom-2 text-crema sm:hidden" />
      <PatronCadena alto={34} className="absolute right-5 bottom-4 hidden text-crema sm:block" />
    </header>
  );
}
