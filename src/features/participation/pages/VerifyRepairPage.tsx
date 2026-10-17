import { ClipboardList, MapPin, SearchX, Trophy } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router";
import { useActiveIdentity } from "@/app/session/store";
import { EstadosReporte } from "@/components/reportes/EstadosReporte";
import { NOMBRE_CATEGORIA_REPORTE } from "@/domain/reportes";
import { evaluarElegibilidad } from "@/domain/verificacion";
import { ButtonLink, Card, DemoTag, EmptyState, ErrorState, LoadingState, PageHeader, formatearFecha } from "@/design-system";
import { useReport, useReportVerifications } from "@/services/hooks";
import type { Reporte, Verificacion } from "@/types";
import { AvisoNoElegible } from "../components/AvisoNoElegible";
import { FormularioVerificacion } from "../components/FormularioVerificacion";
import { VerificacionEnviada } from "../components/VerificacionEnviada";
import { fechaAtencion } from "../lib/verificacion";

const TITULO = "Verificar reparación";

function ResumenReporte({ reporte }: { reporte: Reporte }) {
  const { referencia, colonia } = reporte.ubicacion;
  const atendido = fechaAtencion(reporte);
  return (
    <Card as="section" aria-labelledby="titulo-reporte-verificar" className="flex flex-col gap-3">
      <div>
        <h2 id="titulo-reporte-verificar" className="text-lg font-semibold text-marino">
          {NOMBRE_CATEGORIA_REPORTE[reporte.categoria]}
        </h2>
        <p className="mt-0.5 font-mono text-sm font-medium tracking-wide text-tinta">{reporte.folio}</p>
      </div>
      <p className="flex items-start gap-1.5 text-[0.9375rem] text-tinta">
        <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-marino" />
        <span className="min-w-0 break-words">
          {referencia}
          {colonia ? `, ${colonia}` : ""}
        </span>
      </p>
      <p className="text-[0.9375rem] text-tinta">{reporte.descripcion}</p>
      <EstadosReporte reporte={reporte} />
      {reporte.estadoMunicipal === "solucionado" ? (
        <p className="text-sm text-tinta-suave">
          Atención reportada el <time dateTime={atendido}>{formatearFecha(atendido)}</time> (simulada). Ubicación aproximada de demostración.
        </p>
      ) : null}
      <ButtonLink to={`/reportes/${encodeURIComponent(reporte.id)}`} variante="fantasma" tamano="sm" iconoInicio={ClipboardList} className="self-start">
        Ver el detalle del reporte
      </ButtonLink>
    </Card>
  );
}

/**
 * /participacion/verificar/:reporteId — verificación ciudadana de una reparación. Nunca permite
 * verificar el propio reporte ni verificar dos veces; el resultado queda pendiente de revisión.
 */
export default function VerifyRepairPage() {
  const { reporteId = "" } = useParams();
  const actor = useActiveIdentity();
  const reporte = useReport(reporteId);
  const verificaciones = useReportVerifications(reporteId);
  // La confirmación tiene prioridad: tras enviar, la regla «ya verificado» no debe ocultarla.
  const [enviada, setEnviada] = useState<Verificacion | null>(null);

  const cabecera = (
    <PageHeader titulo={TITULO} antetitulo="Participación" regresar="/participacion">
      <DemoTag>Verificación simulada</DemoTag>
    </PageHeader>
  );

  if (enviada) {
    return (
      <>
        {cabecera}
        <div className="max-w-3xl">
          <VerificacionEnviada verificacion={enviada} />
        </div>
      </>
    );
  }

  if (reporte.isPending || verificaciones.isPending) {
    return (
      <>
        {cabecera}
        <LoadingState etiqueta="Cargando el reporte…" />
      </>
    );
  }

  if (reporte.isError || verificaciones.isError) {
    const error = reporte.error ?? verificaciones.error;
    return (
      <>
        {cabecera}
        <ErrorState
          error={error}
          titulo="No pudimos cargar el reporte"
          onReintentar={() => {
            void reporte.refetch();
            void verificaciones.refetch();
          }}
        />
      </>
    );
  }

  if (!reporte.data) {
    return (
      <>
        {cabecera}
        <EmptyState
          icono={SearchX}
          titulo="No encontramos este reporte"
          descripcion="Puede que se haya borrado al restablecer la demostración. Elige otro reporte en Participación."
          accion={
            <ButtonLink to="/participacion" iconoInicio={Trophy}>
              Ir a Participación
            </ButtonLink>
          }
        />
      </>
    );
  }

  const elegibilidad = evaluarElegibilidad(reporte.data, actor.id, verificaciones.data);

  return (
    <>
      {cabecera}
      {elegibilidad.elegible ? (
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <div className="min-w-0 lg:sticky lg:top-[calc(var(--altura-encabezado)+1.5rem)]">
            <ResumenReporte reporte={reporte.data} />
          </div>
          <Card as="section" aria-labelledby="titulo-formulario-verificacion" relleno="lg" className="min-w-0">
            <h2 id="titulo-formulario-verificacion" className="mb-1 text-xl font-semibold text-marino">
              Cuéntanos qué observaste
            </h2>
            <p className="mb-5 max-w-prose text-[0.9375rem] text-tinta-suave">
              Tu verificación quedará pendiente de revisión. No cambia el estado municipal: un voto ciudadano nunca cierra ni reabre un reporte.
            </p>
            <FormularioVerificacion reporte={reporte.data} onEnviada={setEnviada} />
          </Card>
        </div>
      ) : (
        <AvisoNoElegible codigo={elegibilidad.codigo} motivo={elegibilidad.motivo} reporteId={reporte.data.id} />
      )}
    </>
  );
}
