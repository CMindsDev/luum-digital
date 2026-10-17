import { cx, LabGlyph } from "@/design-system";
import "./presencia-calma.css";

export interface PresenciaCalmaProps {
  tamano?: number;
  className?: string;
}

/**
 * Figura del acompañante: glifo del Laboratorio en tonos suaves que respira lento. Es decorativa
 * (aria-hidden), opcional (se puede ocultar) y distinta de Pekito, el asistente general.
 */
export function PresenciaCalma({ tamano = 72, className }: PresenciaCalmaProps) {
  return (
    <span
      aria-hidden="true"
      className={cx("inline-flex shrink-0 items-center justify-center rounded-full bg-azul-suave text-azul/60 ring-8 ring-lima-suave", className)}
      style={{ width: tamano, height: tamano }}
    >
      <LabGlyph tamano={Math.round(tamano * 0.5)} className="presencia-calma-glifo" />
    </span>
  );
}
