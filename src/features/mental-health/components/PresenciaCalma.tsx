import { cx } from "@/design-system";
import { PekitoMascota } from "@/features/assistant";

export interface PresenciaCalmaProps {
  tamano?: number;
  className?: string;
  estado?: "reposo" | "pensando" | "conectando" | "escuchando" | "hablando";
}

/**
 * Alma, figura opcional del acompañante, con movimientos lentos. Es decorativa
 * (aria-hidden), opcional (se puede ocultar) y distinta de Pekito, el asistente general.
 */
export function PresenciaCalma({ tamano = 72, className, estado = "reposo" }: PresenciaCalmaProps) {
  return (
    <span
      aria-hidden="true"
      className={cx("inline-flex shrink-0 items-center justify-center rounded-full bg-azul-suave text-azul/60 ring-8 ring-lima-suave", className)}
      style={{ width: tamano, height: tamano }}
    >
      <PekitoMascota experto="bienestar" ancho={Math.round(tamano * 0.75)} estado={estado} />
    </span>
  );
}
