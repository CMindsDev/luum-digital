import { cx } from "./cx";

/** Estilos compartidos de campos: borde ≥ 3:1 (borde-control 4.04:1 sobre blanco), 48 px de alto mínimo. */
export function clasesControl({ invalido, className }: { invalido?: boolean; className?: string }): string {
  return cx(
    "block w-full min-h-12 rounded-control border bg-superficie px-3.5 py-2.5 text-base text-tinta placeholder:text-tinta-suave",
    "transition-[border-color,box-shadow] duration-(--duracion-rapida) ease-suave",
    "focus-visible:border-foco focus-visible:outline-3 focus-visible:outline-offset-1",
    "disabled:cursor-not-allowed disabled:bg-superficie-2 disabled:opacity-70",
    invalido ? "border-peligro border-2" : "border-borde-control hover:border-marino",
    className,
  );
}
