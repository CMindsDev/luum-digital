import { ArrowLeft } from "lucide-react";
import { createElement, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { CLASES_MOSAICO, ChainPattern, cx, resolverIcono } from "@/design-system";
import type { Categoria } from "@/types";
import { lineasTitulo } from "../lib/filtros";

export interface EncabezadoCategoriaProps {
  categoria: Categoria;
  /** Rótulo en mayúsculas bajo el título (p. ej. el número de fichas). */
  rotulo?: ReactNode;
}

/**
 * Encabezado temático del Laboratorio para la portada de una categoría: banda del color de la
 * categoría, ícono, título en dos líneas (sans + serif itálica) y rótulo en mayúsculas.
 * Los pares de color vienen de CLASES_MOSAICO (contraste AA calculado en tokens.css).
 */
export function EncabezadoCategoria({ categoria, rotulo }: EncabezadoCategoriaProps) {
  const { t } = useTranslation();
  const colores = CLASES_MOSAICO[categoria.tono];
  const [linea1, linea2] = lineasTitulo(categoria.nombre);
  return (
    <header className={cx("relative mb-6 overflow-hidden rounded-tarjeta p-5 sm:p-8", colores.fondo, colores.texto)}>
      <div className="relative z-10 flex flex-col gap-4">
        <Link
          to="/servicios"
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-pildora bg-superficie px-4 text-sm font-semibold text-marino no-underline shadow-suave hover:bg-marino-suave"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t("Todas las categorías")}
        </Link>
        {createElement(resolverIcono(categoria.icono), { "aria-hidden": true, className: cx("size-12 sm:size-14", colores.icono), strokeWidth: 1.75 })}
        <div>
          <p className="font-mono-rotulo text-xs font-medium tracking-[0.12em] uppercase">{t("Categoría del catálogo")}</p>
          <h1 tabIndex={-1} className="mt-1 text-[2.25rem] leading-[0.98] font-semibold tracking-[-0.03em] text-current sm:text-5xl">
            <span className="block">{linea1}</span>{linea2 ? " " : null}
            {linea2 ? <span className="font-serif-acento block font-normal italic">{linea2}</span> : null}
          </h1>
        </div>
        <p className="max-w-prose text-base">{categoria.descripcion}</p>
        {rotulo ? <p className="font-mono-rotulo text-sm font-medium tracking-[0.05em] uppercase">{rotulo}</p> : null}
      </div>
      <ChainPattern alto={40} className="absolute right-6 bottom-6 hidden opacity-60 md:block" />
    </header>
  );
}
