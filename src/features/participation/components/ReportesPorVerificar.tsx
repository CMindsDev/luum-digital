import { ChevronDown, MapPin, ScanSearch, SearchCheck } from "lucide-react";
import { useState } from "react";
import { EstadosReporte } from "@/components/reportes/EstadosReporte";
import { NOMBRE_CATEGORIA_REPORTE } from "@/domain/reportes";
import { Button, ButtonLink, Card, EmptyState, ErrorState, LoadingState, formatearFecha } from "@/design-system";
import { useVerifiableReports } from "@/services/hooks";
import type { Reporte } from "@/types";
import { fechaAtencion } from "../lib/verificacion";

function ubicacionCorta(reporte: Reporte): string {
  const { referencia, colonia } = reporte.ubicacion;
  return colonia ? `${referencia} · ${colonia}` : referencia;
}

function TarjetaVerificable({ reporte }: { reporte: Reporte }) {
  const nombre = NOMBRE_CATEGORIA_REPORTE[reporte.categoria];
  const atendido = fechaAtencion(reporte);
  return (
    <Card as="article" className="flex h-full flex-col gap-3" data-reporte={reporte.id}>
      <div>
        <h3 className="text-base leading-snug font-semibold text-marino">{nombre}</h3>
        <p className="mt-0.5 font-mono text-sm font-medium tracking-wide text-tinta">{reporte.folio}</p>
      </div>
      <p className="flex items-start gap-1.5 text-sm text-tinta-suave">
        <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span className="min-w-0 break-words">{ubicacionCorta(reporte)}</span>
      </p>
      <EstadosReporte reporte={reporte} />
      <p className="text-sm text-tinta-suave">
        Atención reportada el <time dateTime={atendido}>{formatearFecha(atendido)}</time> (simulada).
      </p>
      <ButtonLink
        to={`/participacion/verificar/${encodeURIComponent(reporte.id)}`}
        iconoInicio={ScanSearch}
        tamano="sm"
        className="mt-auto self-start"
        data-guia={`participacion.verificar_${reporte.id}`}
      >
        Verificar la reparación<span className="sr-only">, folio {reporte.folio}</span>
      </ButtonLink>
    </Card>
  );
}

const POR_PAGINA = 6;

/** Reportes con atención reportada que la identidad activa puede verificar (nunca los propios). */
export function ReportesPorVerificar() {
  const verificables = useVerifiableReports();
  const [visibles, setVisibles] = useState(POR_PAGINA);
  const total = verificables.data?.length;

  return (
    <section aria-labelledby="titulo-por-verificar" className="flex flex-col gap-3" data-guia="participacion.por_verificar">
      <div>
        <h2 id="titulo-por-verificar" className="text-xl font-semibold text-marino">
          Reportes que puedes verificar{total !== undefined ? <span className="font-normal text-tinta-suave"> ({total})</span> : null}
        </h2>
        <p className="mt-1 max-w-prose text-[0.9375rem] text-tinta-suave">
          El Ayuntamiento (simulado) reportó su atención. Si pasas por ahí, cuéntanos qué observaste. Tus propios reportes no aparecen aquí.
        </p>
      </div>
      {verificables.isPending ? (
        <LoadingState etiqueta="Buscando reportes para verificar…" variante="tarjetas" />
      ) : verificables.isError ? (
        <ErrorState error={verificables.error} nivel={3} titulo="No pudimos cargar los reportes para verificar" onReintentar={() => void verificables.refetch()} />
      ) : verificables.data.length === 0 ? (
        <EmptyState
          nivel={3}
          icono={SearchCheck}
          titulo="No hay reportes por verificar"
          descripcion="Cuando el Ayuntamiento (simulado) reporte la atención de un reporte de otra persona, aparecerá aquí."
          accion={
            <ButtonLink to="/reportes" variante="secundario">
              Ir a Reportes
            </ButtonLink>
          }
        />
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label="Reportes por verificar">
            {verificables.data.slice(0, visibles).map((reporte) => (
              <li key={reporte.id} className="min-w-0">
                <TarjetaVerificable reporte={reporte} />
              </li>
            ))}
          </ul>
          {verificables.data.length > visibles ? (
            <Button variante="fantasma" iconoInicio={ChevronDown} className="self-start" onClick={() => setVisibles(verificables.data.length)}>
              Mostrar todos ({verificables.data.length})
            </Button>
          ) : null}
        </>
      )}
    </section>
  );
}
