import { Badge } from "@/design-system";
import type { EstadoRevision } from "@/types";
import { ETIQUETA_REVISION, ICONO_REVISION, TONO_REVISION } from "../lib/verificacion";

export interface EstadoRevisionBadgeProps {
  estado: EstadoRevision;
  className?: string;
}

/** Estado de revisión de una verificación ciudadana (ícono + texto, nunca sólo color). */
export function EstadoRevisionBadge({ estado, className }: EstadoRevisionBadgeProps) {
  return (
    <Badge tono={TONO_REVISION[estado]} icono={ICONO_REVISION[estado]} className={className} data-revision={estado}>
      <span className="sr-only">Revisión: </span>
      {ETIQUETA_REVISION[estado]}
    </Badge>
  );
}
