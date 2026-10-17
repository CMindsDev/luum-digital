import type { EstadoInformacion } from "@/types";
import { DESCRIPCION_INFORMACION, ETIQUETA_INFORMACION, ICONO_INFORMACION } from "../lib/estados";
import type { TonoInsignia } from "../lib/tonos";
import { Badge } from "./Badge";

const TONOS: Record<EstadoInformacion, TonoInsignia> = { verificada: "exito", pendiente: "aviso", demostracion: "ambar" };

export interface InfoStatusBadgeProps {
  /** Qué tan confiable es la información: verificada, pendiente de verificar o de demostración. */
  estado: EstadoInformacion;
  /** Muestra la explicación debajo de la insignia. */
  conDescripcion?: boolean;
  className?: string;
}

/** Estado de la información (eje 1 de cada servicio). */
export function InfoStatusBadge({ estado, conDescripcion = false, className }: InfoStatusBadgeProps) {
  const insignia = (
    <Badge tono={TONOS[estado]} icono={ICONO_INFORMACION[estado]} title={DESCRIPCION_INFORMACION[estado]} data-info={estado}>
      <span className="sr-only">Información: </span>
      {ETIQUETA_INFORMACION[estado]}
    </Badge>
  );
  if (!conDescripcion) return <span className={className}>{insignia}</span>;
  return (
    <span className={className}>
      {insignia}
      <span className="mt-1 block text-sm text-tinta-suave">{DESCRIPCION_INFORMACION[estado]}</span>
    </span>
  );
}
