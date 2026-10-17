import { cx } from "../lib/cx";

export interface SkeletonProps {
  className?: string;
  /** Forma: línea de texto, bloque o círculo. */
  forma?: "linea" | "bloque" | "circulo";
}

/** Marcador de carga decorativo (aria-hidden). Sin animación con movimiento reducido. */
export function Skeleton({ className, forma = "linea" }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "bg-superficie-2 motion-safe:animate-pulse",
        forma === "linea" && "h-4 rounded-pildora",
        forma === "bloque" && "h-24 rounded-tarjeta",
        forma === "circulo" && "size-10 rounded-full",
        className,
      )}
    />
  );
}
