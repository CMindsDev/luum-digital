import { Badge } from "@/design-system";
import { useTranslation } from "react-i18next";
import type { EstadoRevision } from "@/types";
import { ETIQUETA_REVISION, ICONO_REVISION, TONO_REVISION } from "../lib/verificacion";

export interface EstadoRevisionBadgeProps {
  estado: EstadoRevision;
  className?: string;
}

/** Estado de revisión de una verificación ciudadana (ícono + texto, nunca sólo color). */
export function EstadoRevisionBadge({ estado, className }: EstadoRevisionBadgeProps) {
  const { t } = useTranslation();
  return (
    <Badge tono={TONO_REVISION[estado]} icono={ICONO_REVISION[estado]} className={className} data-revision={estado}>
      <span className="sr-only">{t("Revisión:")} </span>
      {t(ETIQUETA_REVISION[estado])}
    </Badge>
  );
}
