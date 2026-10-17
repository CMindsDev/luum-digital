import { ArrowRight } from "lucide-react";
import type { MouseEvent } from "react";
import { ReportCard } from "@/components/reportes/ReportCard";
import { ButtonLink, DemoTag, Sheet } from "@/design-system";
import type { Reporte } from "@/types";

export interface PanelIncidenciaProps {
  reporte: Reporte | null;
  onCerrar: () => void;
  /** Abre el detalle cerrando antes el panel (así, al regresar, el mapa no lo vuelve a abrir). */
  onVerDetalle: (reporte: Reporte) => void;
}

function conModificador(evento: MouseEvent) {
  return evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey || evento.button !== 0;
}

/** Panel de una incidencia tocada en el mapa: tarjeta del reporte (M3) y enlace a su detalle. */
export function PanelIncidencia({ reporte, onCerrar, onVerDetalle }: PanelIncidenciaProps) {
  return (
    <Sheet
      abierto={reporte !== null}
      onCerrar={onCerrar}
      titulo="Incidencia en el mapa"
      descripcion="Reporte de demostración: los datos son ficticios."
      pie={
        reporte ? (
          <ButtonLink
            to={`/reportes/${encodeURIComponent(reporte.id)}`}
            iconoFin={ArrowRight}
            anchoCompleto
            data-guia="mapa.ver_reporte"
            onClick={(evento) => {
              if (conModificador(evento)) return;
              evento.preventDefault();
              onVerDetalle(reporte);
            }}
          >
            Ver detalle del reporte
          </ButtonLink>
        ) : null
      }
    >
      {reporte ? (
        <div className="space-y-3">
          <ReportCard reporte={reporte} enlace={false} />
          <DemoTag>Incidencia de demostración</DemoTag>
        </div>
      ) : null}
    </Sheet>
  );
}
