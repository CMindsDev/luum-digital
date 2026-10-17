import { ClipboardList, LayoutGrid } from "lucide-react";
import { useState } from "react";
import { useProcedures } from "@/services/hooks";
import { ButtonLink, EmptyState, ErrorState, FilterChip, LoadingState, PageHeader } from "@/design-system";
import type { EstadoGestion } from "@/types";
import { BuscarPorFolio } from "../components/BuscarPorFolio";
import { TarjetaGestion } from "../components/TarjetaGestion";
import { ETIQUETA_GRUPO_ESTADO, agruparPorEstado } from "../lib/estados";

/** /gestiones — «Mis gestiones»: gestiones simuladas por estado y búsqueda por folio DEMO-G. */
export default function ProceduresPage() {
  const { data, isPending, isError, error, refetch } = useProcedures();
  const [filtro, setFiltro] = useState<EstadoGestion | null>(null);

  const grupos = data ? agruparPorEstado(data) : [];
  const visibles = filtro ? grupos.filter((grupo) => grupo.estado === filtro) : grupos;

  return (
    <>
      <PageHeader
        titulo="Mis gestiones"
        descripcion="Sigue tus trámites simulados: borradores, envíos con folio DEMO-G, pagos y citas de demostración. Ninguno llega a un sistema municipal."
      />

      <div className="flex flex-col gap-6">
        <BuscarPorFolio />

        <section aria-labelledby="titulo-lista-gestiones">
          <h2 id="titulo-lista-gestiones" className="mb-3 text-xl font-semibold text-marino">
            Tus gestiones
          </h2>
          {isPending ? (
            <LoadingState etiqueta="Cargando tus gestiones…" variante="tarjetas" />
          ) : isError ? (
            <ErrorState error={error} onReintentar={() => void refetch()} />
          ) : data.length === 0 ? (
            <EmptyState
              icono={ClipboardList}
              titulo="Todavía no tienes gestiones simuladas"
              descripcion="Elige un trámite del catálogo y empieza una solicitud de demostración. Aquí verás su folio y su historial."
              accion={
                <ButtonLink to="/servicios" iconoInicio={LayoutGrid}>
                  Explorar trámites y servicios
                </ButtonLink>
              }
            />
          ) : (
            <>
              <div role="group" aria-label="Filtrar por estado" className="mb-5 flex flex-wrap gap-2">
                <FilterChip seleccionado={filtro === null} onCambiar={() => setFiltro(null)} conteo={data.length} guia="gestiones.filtro_todas">
                  Todas
                </FilterChip>
                {grupos.map((grupo) => (
                  <FilterChip
                    key={grupo.estado}
                    seleccionado={filtro === grupo.estado}
                    onCambiar={(seleccionado) => setFiltro(seleccionado ? grupo.estado : null)}
                    conteo={grupo.gestiones.length}
                    guia={`gestiones.filtro_${grupo.estado}`}
                  >
                    {ETIQUETA_GRUPO_ESTADO[grupo.estado]}
                  </FilterChip>
                ))}
              </div>
              <div className="flex flex-col gap-6">
                {visibles.map((grupo) => (
                  <section key={grupo.estado} aria-labelledby={`grupo-${grupo.estado}`}>
                    <h3 id={`grupo-${grupo.estado}`} className="mb-3 text-base font-semibold text-tinta">
                      {ETIQUETA_GRUPO_ESTADO[grupo.estado]} <span className="font-normal text-tinta-suave">({grupo.gestiones.length})</span>
                    </h3>
                    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {grupo.gestiones.map((gestion) => (
                        <li key={gestion.id} className="min-w-0">
                          <TarjetaGestion gestion={gestion} nivelTitulo={4} />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
