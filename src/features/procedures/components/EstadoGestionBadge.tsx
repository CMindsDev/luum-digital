import { useTranslation } from "react-i18next";
import { Badge } from "@/design-system";
import type { EstadoGestion } from "@/types";
import { ETIQUETA_ESTADO_GESTION, ICONO_ESTADO_GESTION, TONO_ESTADO_GESTION } from "../lib/estados";

export interface EstadoGestionBadgeProps {
  estado: EstadoGestion;
  tamano?: "sm" | "md";
  className?: string;
}

export function EstadoGestionBadge({ estado, tamano = "sm", className }: EstadoGestionBadgeProps) {
  const { t } = useTranslation();
  return (
    <Badge tono={TONO_ESTADO_GESTION[estado]} icono={ICONO_ESTADO_GESTION[estado]} tamano={tamano} className={className} data-estado-gestion={estado}>
      <span className="sr-only">{t("Estado:")} </span>
      {t(ETIQUETA_ESTADO_GESTION[estado])}
    </Badge>
  );
}
