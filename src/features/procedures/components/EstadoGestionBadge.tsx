import { Badge } from "@/design-system";
import type { EstadoGestion } from "@/types";
import { ETIQUETA_ESTADO_GESTION, ICONO_ESTADO_GESTION, TONO_ESTADO_GESTION } from "../lib/estados";

export interface EstadoGestionBadgeProps {
  estado: EstadoGestion;
  tamano?: "sm" | "md";
  className?: string;
}

/** Estado de una gestión simulada con ícono + texto. */
export function EstadoGestionBadge({ estado, tamano = "sm", className }: EstadoGestionBadgeProps) {
  return (
    <Badge tono={TONO_ESTADO_GESTION[estado]} icono={ICONO_ESTADO_GESTION[estado]} tamano={tamano} className={className} data-estado-gestion={estado}>
      <span className="sr-only">Estado: </span>
      {ETIQUETA_ESTADO_GESTION[estado]}
    </Badge>
  );
}
