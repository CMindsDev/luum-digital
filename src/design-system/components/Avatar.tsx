import { cx } from "../lib/cx";

export interface AvatarProps {
  iniciales: string;
  /** Si se da, el avatar se anuncia con este nombre; si no, es decorativo. */
  nombre?: string;
  tamano?: "sm" | "md" | "lg";
  /** claro (lima del logotipo con marino) u oscuro (marino con blanco). */
  tono?: "claro" | "oscuro";
  className?: string;
}

const TAMANOS = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-lg" } as const;

/** Avatar con iniciales (identidades ficticias; no hay fotografías). */
export function Avatar({ iniciales, nombre, tamano = "md", tono = "claro", className }: AvatarProps) {
  return (
    <span
      role={nombre ? "img" : undefined}
      aria-label={nombre}
      aria-hidden={nombre ? undefined : true}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold select-none",
        // marino sobre lima-logo 8.73:1 · blanco sobre marino 12.06:1
        tono === "claro" ? "bg-lima-logo text-marino" : "bg-marino text-white",
        TAMANOS[tamano],
        className,
      )}
    >
      {iniciales.slice(0, 2).toUpperCase()}
    </span>
  );
}
