import { LoaderCircle } from "lucide-react";
import { cx } from "../lib/cx";
import { Skeleton } from "./Skeleton";

export interface LoadingStateProps {
  /** Texto anunciado y visible. */
  etiqueta?: string;
  /** lineas (por omisión), tarjetas (rejilla de bloques) o compacto (sólo indicador). */
  variante?: "lineas" | "tarjetas" | "compacto";
  className?: string;
}

/** Estado de carga con región role="status". */
export function LoadingState({ etiqueta = "Cargando…", variante = "lineas", className }: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite" className={cx("w-full", className)}>
      <p className="flex items-center gap-2 text-sm font-medium text-tinta-suave">
        <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" />
        {etiqueta}
      </p>
      {variante === "lineas" ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="w-3/4" />
          <Skeleton className="w-full" />
          <Skeleton className="w-5/6" />
          <Skeleton forma="bloque" className="mt-2" />
        </div>
      ) : null}
      {variante === "tarjetas" ? (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton forma="bloque" />
          <Skeleton forma="bloque" />
          <Skeleton forma="bloque" />
        </div>
      ) : null}
    </div>
  );
}
