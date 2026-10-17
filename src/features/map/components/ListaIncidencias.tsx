import { FilterX, MapPinned } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ReportCard } from "@/components/reportes/ReportCard";
import { Button, EmptyState, ErrorState, LoadingState } from "@/design-system";
import type { Reporte } from "@/types";

const TAMANO_PAGINA = 12;

export interface ListaIncidenciasProps {
  reportes: readonly Reporte[] | undefined;
  cargando: boolean;
  error: unknown;
  onReintentar: () => void;
  hayFiltros: boolean;
  onLimpiarFiltros: () => void;
  /** Título de la sección (h2). */
  titulo?: string;
}

/**
 * Lista accesible de las incidencias filtradas. Es la alternativa completa al mapa (teclado y lector
 * de pantalla) y el respaldo cuando el mapa no carga. Cada tarjeta abre el detalle del reporte.
 */
export function ListaIncidencias({
  reportes,
  cargando,
  error,
  onReintentar,
  hayFiltros,
  onLimpiarFiltros,
  titulo = "Incidencias de demostración",
}: ListaIncidenciasProps) {
  const [limite, setLimite] = useState(TAMANO_PAGINA);

  let contenido: ReactNode;
  if (cargando && !reportes) {
    contenido = <LoadingState etiqueta="Cargando incidencias…" variante="tarjetas" />;
  } else if (error && !reportes) {
    contenido = <ErrorState error={error} onReintentar={onReintentar} nivel={3} />;
  } else if (!reportes || reportes.length === 0) {
    contenido = (
      <EmptyState
        nivel={3}
        icono={MapPinned}
        titulo={hayFiltros ? "No hay incidencias con estos filtros" : "Aún no hay incidencias"}
        descripcion={hayFiltros ? "Prueba con otro tipo de reporte u otro estado." : "Cuando se registren reportes de demostración aparecerán aquí."}
        accion={
          hayFiltros ? (
            <Button variante="secundario" iconoInicio={FilterX} onClick={onLimpiarFiltros}>
              Limpiar filtros
            </Button>
          ) : undefined
        }
      />
    );
  } else {
    const mostrados = reportes.slice(0, limite);
    contenido = (
      <>
        <ul className="grid gap-3 md:grid-cols-2" aria-label="Incidencias">
          {mostrados.map((reporte) => (
            <li key={reporte.id} className="min-w-0">
              <ReportCard reporte={reporte} compacta />
            </li>
          ))}
        </ul>
        {reportes.length > limite ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variante="secundario" onClick={() => setLimite((actual) => actual + TAMANO_PAGINA)}>
              Mostrar {Math.min(TAMANO_PAGINA, reportes.length - limite)} más
            </Button>
            <p className="text-sm text-tinta-suave">
              Mostrando {mostrados.length} de {reportes.length}
            </p>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <section aria-labelledby="titulo-lista-incidencias" data-guia="mapa.lista_incidencias">
      <h2 id="titulo-lista-incidencias" className="mb-3 text-lg font-semibold text-marino">
        {titulo}
      </h2>
      {contenido}
    </section>
  );
}
