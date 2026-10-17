import type { EstadoVerificacionCiudadana } from "@/types";
import { ETIQUETA_VERIFICACION, ICONO_VERIFICACION } from "../lib/estados";
import type { TonoInsignia } from "../lib/tonos";
import { Badge } from "./Badge";

const TONOS: Record<EstadoVerificacionCiudadana, TonoInsignia> = {
  no_aplica: "neutro",
  pendiente: "azul",
  coincide: "exito",
  discrepancia: "aviso",
  no_concluyente: "neutro",
};

export interface VerificationBadgeProps {
  /** Resultado de la verificación ciudadana (independiente del estado municipal). */
  estado: EstadoVerificacionCiudadana;
  /** Muestra «Verificación ciudadana:» de forma visible (por omisión sólo para lectores de pantalla). */
  conPrefijo?: boolean;
  className?: string;
}

/** Verificación ciudadana con ícono + texto. Un voto ciudadano nunca cierra un reporte. */
export function VerificationBadge({ estado, conPrefijo = false, className }: VerificationBadgeProps) {
  return (
    <Badge tono={TONOS[estado]} icono={ICONO_VERIFICACION[estado]} className={className} data-verificacion={estado}>
      <span className={conPrefijo ? undefined : "sr-only"}>Verificación ciudadana: </span>
      {ETIQUETA_VERIFICACION[estado]}
    </Badge>
  );
}
