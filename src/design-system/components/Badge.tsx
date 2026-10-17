import type { LucideIcon } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../lib/cx";
import { CLASES_ICONO_INSIGNIA, CLASES_INSIGNIA, type TonoInsignia } from "../lib/tonos";

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  tono?: TonoInsignia;
  icono?: LucideIcon;
  tamano?: "sm" | "md";
  children: ReactNode;
}

/** Insignia de texto (con ícono opcional). Los estados nunca se comunican sólo con color. */
export function Badge({ tono = "neutro", icono: Icono, tamano = "sm", className, children, ...resto }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex max-w-full items-center gap-1.5 rounded-pildora border font-semibold whitespace-nowrap",
        tamano === "sm" ? "px-2.5 py-0.5 text-xs leading-5" : "px-3 py-1 text-sm",
        CLASES_INSIGNIA[tono],
        className,
      )}
      {...resto}
    >
      {Icono ? <Icono aria-hidden="true" className={cx("size-3.5 shrink-0", CLASES_ICONO_INSIGNIA[tono])} /> : null}
      <span className="truncate">{children}</span>
    </span>
  );
}
