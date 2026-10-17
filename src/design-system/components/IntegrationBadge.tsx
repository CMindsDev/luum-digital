import type { EstadoIntegracion } from "@/types";
import { DESCRIPCION_INTEGRACION, ETIQUETA_INTEGRACION, ICONO_INTEGRACION } from "../lib/estados";
import { Badge } from "./Badge";

export interface IntegrationBadgeProps {
  /** Si la interacción toca un sistema real («conectada») o se simula en el navegador. */
  estado: EstadoIntegracion;
  conDescripcion?: boolean;
  className?: string;
}

/** Estado de integración (eje 2 de cada servicio). Un enlace externo no es una integración. */
export function IntegrationBadge({ estado, conDescripcion = false, className }: IntegrationBadgeProps) {
  const insignia = (
    <Badge
      tono={estado === "conectada" ? "exito" : "marino"}
      icono={ICONO_INTEGRACION[estado]}
      title={DESCRIPCION_INTEGRACION[estado]}
      data-integracion={estado}
    >
      <span className="sr-only">Integración: </span>
      {ETIQUETA_INTEGRACION[estado]}
    </Badge>
  );
  if (!conDescripcion) return <span className={className}>{insignia}</span>;
  return (
    <span className={className}>
      {insignia}
      <span className="mt-1 block text-sm text-tinta-suave">{DESCRIPCION_INTEGRACION[estado]}</span>
    </span>
  );
}
