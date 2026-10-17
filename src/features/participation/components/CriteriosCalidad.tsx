import { CircleCheck, CircleMinus } from "lucide-react";
import { cx } from "@/design-system";
import type { CalidadVerificacion } from "@/types";

const CRITERIOS: ReadonlyArray<{ clave: keyof CalidadVerificacion; etiqueta: string }> = [
  { clave: "descripcionUtil", etiqueta: "Comentario útil" },
  { clave: "ubicacionConfirmada", etiqueta: "Ubicación confirmada" },
  { clave: "evidencia", etiqueta: "Foto de evidencia" },
];

export interface CriteriosCalidadProps {
  calidad: CalidadVerificacion;
  /** Nombre accesible de la lista. */
  etiqueta?: string;
  className?: string;
}

/** Criterios de calidad de una verificación, con ícono + texto («cumple» / «no»). */
export function CriteriosCalidad({ calidad, etiqueta = "Criterios de calidad", className }: CriteriosCalidadProps) {
  return (
    <ul aria-label={etiqueta} className={cx("flex flex-wrap gap-x-4 gap-y-1.5", className)}>
      {CRITERIOS.map(({ clave, etiqueta: texto }) => {
        const cumple = calidad[clave];
        const Icono = cumple ? CircleCheck : CircleMinus;
        return (
          <li key={clave} className={cx("inline-flex items-center gap-1.5 text-sm", cumple ? "font-medium text-exito" : "text-tinta-suave")}>
            <Icono aria-hidden="true" className="size-4 shrink-0" />
            {texto}
            <span className="sr-only">{cumple ? ": sí" : ": no"}</span>
          </li>
        );
      })}
    </ul>
  );
}
