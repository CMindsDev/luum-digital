import { cx } from "@/design-system";
import type { EstadoMascota } from "./estado-mascota";
import { PekitoAnimado } from "./PekitoAnimado";

/** Proporciones del recurso exportado de Figma (nodo 34:1586, 212.885 × 198.681). */
const ANCHO = 212.885;
const ALTO = 198.681;

export interface PekitoMascotaProps {
  /** Ancho en píxeles; el alto conserva la proporción del diseño. */
  ancho?: number;
  /** Movimiento suave de reposo (se desactiva con movimiento reducido). Sólo para la imagen estática. */
  respira?: boolean;
  /** Si se indica, la mascota se anima según el estado del asistente (luces, cuerpo y efectos). */
  estado?: EstadoMascota;
  /** Nivel de voz 0..1 para el estado «hablando». */
  nivel?: number;
  className?: string;
}

/** Mascota de Pekito. Decorativa: el nombre y la función los comunica el texto que la acompaña. */
export function PekitoMascota({ ancho = ANCHO, respira = false, estado, nivel, className }: PekitoMascotaProps) {
  if (estado) return <PekitoAnimado estado={estado} ancho={ancho} {...(nivel === undefined ? {} : { nivel })} {...(className ? { className } : {})} />;
  return (
    <img
      src="/brand/laboratorio/agente/pekito-mascota.svg"
      alt=""
      aria-hidden="true"
      width={ancho}
      height={Math.round((ancho * ALTO) / ANCHO)}
      draggable={false}
      className={cx("block select-none", respira && "pekito-respira", className)}
    />
  );
}
