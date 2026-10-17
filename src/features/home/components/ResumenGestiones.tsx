import { ChevronRight, ClipboardList, LayoutGrid } from "lucide-react";
import { Link } from "react-router";
import { Badge, ButtonLink, Card, DemoTag, EmptyState, ErrorState, formatearFecha, LoadingState } from "@/design-system";
import { useProcedures } from "@/services/hooks";
import { ESTADO_GESTION, gestionesRecientes } from "../lib/gestiones";

/** Resumen de «Mis gestiones» (simuladas) de la identidad activa, con enlace a cada una. */
export function ResumenGestiones() {
  const gestiones = useProcedures();
  const recientes = gestiones.data ? gestionesRecientes(gestiones.data) : [];
  const total = gestiones.data?.length ?? 0;

  return (
    <Card as="section" aria-labelledby="titulo-resumen-gestiones" relleno="md" className="flex flex-col" data-guia="inicio.resumen_gestiones">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 id="titulo-resumen-gestiones" className="flex items-center gap-2 text-lg font-semibold text-marino">
          <ClipboardList aria-hidden="true" className="size-5 text-azul" />
          Mis gestiones
        </h3>
        <DemoTag>Simuladas</DemoTag>
      </div>

      {gestiones.isPending ? <LoadingState etiqueta="Cargando tus gestiones…" variante="compacto" /> : null}

      {gestiones.isError ? (
        <ErrorState error={gestiones.error} nivel={3} onReintentar={() => void gestiones.refetch()} />
      ) : null}

      {gestiones.isSuccess && total === 0 ? (
        <EmptyState
          nivel={3}
          icono={ClipboardList}
          titulo="Aún no tienes gestiones"
          descripcion="Cuando inicies un trámite de demostración, aquí verás su estado y su folio."
          accion={
            <ButtonLink to="/servicios" variante="secundario" tamano="sm" iconoInicio={LayoutGrid}>
              Explorar trámites
            </ButtonLink>
          }
          className="py-6"
        />
      ) : null}

      {gestiones.isSuccess && total > 0 ? (
        <ul className="divide-y divide-borde">
          {recientes.map((gestion) => {
            const estado = ESTADO_GESTION[gestion.estado];
            return (
              <li key={gestion.id}>
                <Link
                  to={`/gestiones/${encodeURIComponent(gestion.id)}`}
                  className="group flex min-h-11 items-start gap-3 rounded-control py-3 no-underline hover:bg-superficie-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 font-medium text-tinta">{gestion.servicioNombre}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-tinta-suave">
                      <Badge tono={estado.tono} icono={estado.icono}>
                        <span className="sr-only">Estado: </span>
                        {estado.etiqueta}
                      </Badge>
                      <span className="font-mono text-[0.8125rem] font-medium text-tinta">{gestion.folio ?? "Sin folio (borrador)"}</span>
                      <span>
                        Actualizada el <time dateTime={gestion.actualizadaEn}>{formatearFecha(gestion.actualizadaEn)}</time>
                      </span>
                    </span>
                  </span>
                  <ChevronRight aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-tinta-suave transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}

      {gestiones.isSuccess && total > 0 ? (
        <div className="mt-auto pt-4">
          <ButtonLink to="/gestiones" variante="secundario" tamano="sm" iconoFin={ChevronRight} data-guia="inicio.ver_gestiones">
            {total > recientes.length ? `Ver mis ${total} gestiones` : "Ver mis gestiones"}
          </ButtonLink>
        </div>
      ) : null}
    </Card>
  );
}
