import { ChevronDown } from "lucide-react";
import { useId } from "react";
import { ReportCard } from "@/components/reportes/ReportCard";
import { ETIQUETA_FILTRO_ESTADO_MUNICIPAL, ICONO_ESTADO_MUNICIPAL, cx } from "@/design-system";
import type { EstadoMunicipal, Reporte } from "@/types";

const PUNTO: Record<EstadoMunicipal, string> = {
  registrado: "bg-estado-registrado",
  en_proceso: "bg-estado-proceso",
  solucionado: "bg-estado-solucionado",
  cancelado: "bg-estado-cancelado",
};

export interface GrupoEstadoProps {
  estado: EstadoMunicipal;
  reportes: Reporte[];
  abierto: boolean;
  onAlternar: () => void;
}

/** Fila de estatus con punto de color, ícono, etiqueta y contador (como Mérida Móvil); se despliega. */
export function GrupoEstado({ estado, reportes, abierto, onAlternar }: GrupoEstadoProps) {
  const idPanel = useId();
  const Icono = ICONO_ESTADO_MUNICIPAL[estado];
  const etiqueta = ETIQUETA_FILTRO_ESTADO_MUNICIPAL[estado];

  return (
    <section data-estado={estado} className="rounded-tarjeta border border-borde bg-superficie shadow-suave">
      <h2 className="text-base">
        <button
          type="button"
          aria-expanded={abierto}
          aria-controls={idPanel}
          onClick={onAlternar}
          className="flex min-h-14 w-full items-center gap-3 rounded-tarjeta px-4 py-3 text-left"
        >
          <span aria-hidden="true" className={cx("size-3 shrink-0 rounded-full", PUNTO[estado])} />
          <Icono aria-hidden="true" className="size-5 shrink-0 text-tinta-suave" />
          <span className="min-w-0 flex-1 font-semibold text-marino">{etiqueta}</span>
          <span className="inline-flex min-w-8 items-center justify-center rounded-pildora bg-superficie-2 px-2 text-sm font-semibold text-tinta">
            {reportes.length}
            <span className="sr-only">{reportes.length === 1 ? " reporte" : " reportes"}</span>
          </span>
          <ChevronDown aria-hidden="true" className={cx("size-5 shrink-0 text-tinta-suave transition-transform", abierto && "rotate-180")} />
        </button>
      </h2>
      <div id={idPanel} hidden={!abierto} className="border-t border-borde px-3 pt-3 pb-3 sm:px-4">
        {reportes.length === 0 ? (
          <p className="px-1 py-2 text-[0.9375rem] text-tinta-suave">No tienes reportes con este estatus en este periodo.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {reportes.map((reporte) => (
              <li key={reporte.id}>
                <ReportCard reporte={reporte} compacta />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
