import { ReportCard } from "@/components/reportes/ReportCard";
import { DemoTag, Sheet } from "@/design-system";
import type { Reporte } from "@/types";
import { LEYENDA_DEMANDA_REPORTADA } from "../catalogo-capas";

export interface ZonaSeleccionada {
  h3: string;
  resolucion: number;
  incidencias: Reporte[];
}

export interface PanelZonaProps {
  zona: ZonaSeleccionada | null;
  onCerrar: () => void;
}

const MAXIMO_LISTADO = 8;

/** Panel de una zona H3 tocada en el mapa: cuántas incidencias tiene y cuáles son. */
export function PanelZona({ zona, onCerrar }: PanelZonaProps) {
  const total = zona?.incidencias.length ?? 0;
  return (
    <Sheet
      abierto={zona !== null}
      onCerrar={onCerrar}
      titulo={total === 1 ? "Zona con 1 incidencia" : `Zona con ${total} incidencias`}
      descripcion={LEYENDA_DEMANDA_REPORTADA}
    >
      {zona ? (
        <div className="space-y-3">
          <p className="flex flex-wrap items-center gap-2 text-sm text-tinta-suave">
            <DemoTag>Datos de demostración</DemoTag>
            <span>Zona hexagonal de tamaño {zona.resolucion === 9 ? "colonia" : "ciudad"} (H3, resolución {zona.resolucion}).</span>
          </p>
          <ul className="space-y-3" aria-label="Incidencias de la zona">
            {zona.incidencias.slice(0, MAXIMO_LISTADO).map((reporte) => (
              <li key={reporte.id}>
                <ReportCard reporte={reporte} compacta nivelTitulo={3} />
              </li>
            ))}
          </ul>
          {total > MAXIMO_LISTADO ? (
            <p className="text-sm text-tinta-suave">
              Y {total - MAXIMO_LISTADO} más. Acerca el mapa o usa la vista Lista con filtros para revisarlas todas.
            </p>
          ) : null}
        </div>
      ) : null}
    </Sheet>
  );
}
