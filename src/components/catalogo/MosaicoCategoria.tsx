import { createElement } from "react";
import { CLASES_MOSAICO, LabGlyph, cx, resolverIcono } from "@/design-system";
import type { Categoria } from "@/types";

export interface MosaicoCategoriaProps {
  categoria: Categoria | null;
  /** Lado del mosaico: sm 40 px (listas), md 48 px (tarjetas), lg 64 px (encabezados). */
  tamano?: "sm" | "md" | "lg";
  className?: string;
}

const TAMANOS = {
  sm: { caja: "size-10", icono: "size-5" },
  md: { caja: "size-12", icono: "size-6" },
  lg: { caja: "size-16", icono: "size-8" },
} as const;

/**
 * Mosaico de color del Laboratorio (radio 17.5 % del lado) con el ícono de la categoría.
 * Decorativo: la categoría siempre se nombra con texto junto al mosaico.
 */
export function MosaicoCategoria({ categoria, tamano = "md", className }: MosaicoCategoriaProps) {
  const medidas = TAMANOS[tamano];
  const colores = CLASES_MOSAICO[categoria?.tono ?? "marino"];
  return (
    <span
      aria-hidden="true"
      className={cx("inline-flex shrink-0 items-center justify-center rounded-[17.5%]", medidas.caja, colores.fondo, className)}
    >
      {categoria ? (
        createElement(resolverIcono(categoria.icono), { className: cx(medidas.icono, colores.icono), strokeWidth: 2 })
      ) : (
        <LabGlyph tamano="55%" className={colores.icono} />
      )}
    </span>
  );
}
