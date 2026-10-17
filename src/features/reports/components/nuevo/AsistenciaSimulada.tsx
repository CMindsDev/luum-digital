import { CircleCheck, Lightbulb, Sparkles } from "lucide-react";
import { useId } from "react";
import { NOMBRE_CATEGORIA_REPORTE } from "@/domain/reportes";
import { Button, DemoTag, cx } from "@/design-system";
import type { CategoriaReporte } from "@/types";
import type { Faltante } from "../../lib/asistencia";

export interface AsistenciaSimuladaProps {
  categoriaActual: CategoriaReporte | "";
  categoriaSugerida?: CategoriaReporte;
  onUsarCategoria?: (categoria: CategoriaReporte) => void;
  resumen?: string;
  faltantes: Faltante[];
  /** Texto de posibles coincidencias (paso de revisión). */
  coincidencias?: string;
  /** Texto cuando no falta nada. */
  textoCompleto?: string;
  className?: string;
}

/**
 * Panel «Asistencia simulada»: sugerencias con reglas locales, siempre rotuladas. La persona decide
 * si acepta la categoría sugerida; nada se aplica ni se envía solo.
 */
export function AsistenciaSimulada({
  categoriaActual,
  categoriaSugerida,
  onUsarCategoria,
  resumen,
  faltantes,
  coincidencias,
  textoCompleto = "Tu reporte tiene la información principal.",
  className,
}: AsistenciaSimuladaProps) {
  const idTitulo = useId();
  const sugerirCambio = categoriaSugerida && categoriaSugerida !== categoriaActual;
  return (
    <aside aria-labelledby={idTitulo} className={cx("rounded-tarjeta border border-borde bg-superficie-2 p-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles aria-hidden="true" className="size-5 text-marino" />
        <h3 id={idTitulo} className="text-base font-semibold text-marino">
          Asistencia simulada
        </h3>
        <DemoTag>Reglas locales</DemoTag>
      </div>

      {sugerirCambio ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.9375rem] text-tinta">
            Por tu descripción, parece un reporte de <strong className="font-semibold">«{NOMBRE_CATEGORIA_REPORTE[categoriaSugerida]}»</strong>.
          </p>
          {onUsarCategoria ? (
            <Button variante="secundario" tamano="sm" onClick={() => onUsarCategoria(categoriaSugerida)} data-guia="reportes.usar_categoria_sugerida">
              Cambiar a «{NOMBRE_CATEGORIA_REPORTE[categoriaSugerida]}»
            </Button>
          ) : null}
        </div>
      ) : null}

      {resumen ? (
        <p className="mt-3 text-[0.9375rem] text-tinta">
          <span className="font-semibold">Resumen: </span>
          {resumen}
        </p>
      ) : null}

      {faltantes.length > 0 ? (
        <div className="mt-3">
          <p className="text-sm font-semibold text-tinta">Para mejorar tu reporte:</p>
          <ul className="mt-1.5 space-y-1.5">
            {faltantes.map((faltante) => (
              <li key={faltante.texto} className="flex items-start gap-2 text-[0.9375rem] text-tinta">
                <Lightbulb aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-aviso" />
                {faltante.texto}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-3 flex items-start gap-2 text-[0.9375rem] text-tinta">
          <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-exito" />
          {textoCompleto}
        </p>
      )}

      {coincidencias ? <p className="mt-3 text-[0.9375rem] text-tinta">{coincidencias}</p> : null}

      <p className="mt-3 text-sm text-tinta-suave">
        Sugerencias automáticas con reglas locales de demostración: revisa y decide tú. Una foto ayuda a ubicar el problema, pero no demuestra
        su profundidad, su peligrosidad ni su autenticidad.
      </p>
    </aside>
  );
}
