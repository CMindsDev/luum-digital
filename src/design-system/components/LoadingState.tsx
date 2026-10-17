import { useTranslation } from "react-i18next";
import { cx } from "../lib/cx";
import { Skeleton } from "./Skeleton";

export interface LoadingStateProps {
  /** Texto anunciado y visible. */
  etiqueta?: string;
  /** lineas (por omisión), tarjetas (rejilla de bloques) o compacto (sólo indicador). */
  variante?: "lineas" | "tarjetas" | "compacto";
  className?: string;
}

/** Colores del loader de mosaicos del Laboratorio: azul, ámbar, café y magenta. */
const MOSAICOS = ["bg-azul", "bg-ambar", "bg-cafe", "bg-magenta"] as const;

/**
 * Estado de carga con región role="status" y texto visible. El indicador son 4 mosaicos que aparecen
 * en secuencia; con movimiento reducido quedan quietos (el texto sigue anunciando la carga).
 */
export function LoadingState({ etiqueta, variante = "lineas", className }: LoadingStateProps) {
  const { t } = useTranslation();
  return (
    <div role="status" aria-live="polite" className={cx("w-full", className)}>
      <p className="flex items-center gap-2 text-sm font-medium text-tinta-suave">
        <span aria-hidden="true" className="inline-flex items-center gap-1">
          {MOSAICOS.map((color, indice) => (
            <span
              key={color}
              style={{ animationDelay: `${indice * 120}ms` }}
              className={cx("size-3.5 rounded-[17.5%] motion-safe:animate-carga-mosaico", color)}
            />
          ))}
        </span>
        {etiqueta ?? t("Cargando…")}
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
