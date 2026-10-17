import { cx } from "./cx";

export type VarianteBoton = "primario" | "secundario" | "fantasma" | "exito" | "peligro" | "acento";
export type TamanoBoton = "sm" | "md" | "lg";

const BASE =
  "inline-flex select-none items-center justify-center gap-2 rounded-boton text-center font-semibold leading-tight no-underline " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-(--duracion-rapida) ease-suave " +
  "motion-safe:active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 " +
  "aria-disabled:cursor-not-allowed aria-disabled:opacity-55";

/*
 * Contrastes: primario blanco/marino 12.06:1 · secundario marino/blanco 12.06:1 · fantasma marino/fondo 11.42:1 ·
 * éxito blanco/#3B6D1A 6.20:1 · peligro blanco/#A63A33 6.41:1 · acento marino/lima-logo 8.73:1.
 */
const VARIANTES: Record<VarianteBoton, string> = {
  primario: "bg-marino text-white shadow-suave hover:bg-marino-portal",
  secundario: "border-2 border-marino bg-superficie text-marino hover:bg-marino-suave",
  fantasma: "bg-transparent text-marino hover:bg-marino-suave",
  exito: "bg-exito text-white shadow-suave hover:bg-exito/90",
  peligro: "bg-peligro text-white shadow-suave hover:bg-peligro/90",
  acento: "bg-lima-logo text-marino shadow-suave hover:bg-lima",
};

/** Todos los tamaños miden al menos 44 px de alto (objetivo táctil). */
const TAMANOS: Record<TamanoBoton, string> = {
  sm: "min-h-11 px-3.5 text-sm",
  md: "min-h-12 px-5 text-[0.9375rem]",
  lg: "min-h-14 px-6 text-base",
};

export function clasesBoton({
  variante = "primario",
  tamano = "md",
  anchoCompleto = false,
  className,
}: {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  anchoCompleto?: boolean;
  className?: string;
}): string {
  return cx(BASE, VARIANTES[variante], TAMANOS[tamano], anchoCompleto && "w-full", className);
}

export type VarianteBotonIcono = "fantasma" | "secundario" | "primario" | "oscuro";
export type TamanoBotonIcono = "md" | "lg";

const VARIANTES_ICONO: Record<VarianteBotonIcono, string> = {
  fantasma: "bg-transparent text-marino hover:bg-marino-suave",
  secundario: "border border-borde bg-superficie text-marino shadow-suave hover:bg-superficie-2",
  primario: "bg-marino text-white hover:bg-marino-portal",
  // Sobre el encabezado marino: ícono blanco (12.06:1) y foco lima (clase superficie-oscura en el contenedor).
  oscuro: "bg-transparent text-white hover:bg-white/12",
};

const TAMANOS_ICONO: Record<TamanoBotonIcono, string> = {
  md: "size-11",
  lg: "size-12",
};

export function clasesBotonIcono({
  variante = "fantasma",
  tamano = "md",
  className,
}: {
  variante?: VarianteBotonIcono;
  tamano?: TamanoBotonIcono;
  className?: string;
}): string {
  return cx(
    "relative inline-flex shrink-0 items-center justify-center rounded-boton transition-colors duration-(--duracion-rapida) ease-suave",
    "disabled:cursor-not-allowed disabled:opacity-55",
    VARIANTES_ICONO[variante],
    TAMANOS_ICONO[tamano],
    className,
  );
}
