import { ClipboardList, MapPin, MapPinned, SearchX, Sparkles } from "lucide-react";
import { useParams } from "react-router";
import { useActiveIdentity } from "@/app/session/store";
import { EstadosReporte } from "@/components/reportes/EstadosReporte";
import { ETIQUETA_ORIGEN_UBICACION } from "@/components/reportes/categorias-reporte";
import { NOMBRE_CATEGORIA_REPORTE } from "@/domain/reportes";
import {
  Badge,
  ButtonLink,
  Card,
  DemoTag,
  EmptyState,
  ErrorState,
  KeyValueList,
  LoadingState,
  PageHeader,
  formatearFechaHora,
} from "@/design-system";
import { useReport } from "@/services/hooks";
import { AportacionesReporte } from "../components/detalle/AportacionesReporte";
import { HistorialReporte } from "../components/detalle/HistorialReporte";
import { VerificacionCiudadana } from "../components/detalle/VerificacionCiudadana";
import { formatearCoordenadas } from "../lib/ubicacion";

/**
 * /reportes/:reporteId — estado municipal y verificación ciudadana (ejes distintos), datos,
 * ubicación con enlace al mapa, aportaciones, verificación y línea de tiempo.
 */
export default function ReportDetailPage() {
  const { reporteId } = useParams();
  const actor = useActiveIdentity();
  const consulta = useReport(reporteId);

  if (consulta.isPending) {
    return (
      <>
        <PageHeader titulo="Detalle del reporte" regresar />
        <LoadingState etiqueta="Cargando el reporte…" />
      </>
    );
  }

  if (consulta.isError) {
    return (
      <>
        <PageHeader titulo="Detalle del reporte" regresar />
        <ErrorState error={consulta.error} onReintentar={() => void consulta.refetch()} titulo="No pudimos cargar el reporte" />
      </>
    );
  }

  const reporte = consulta.data;
  if (!reporte) {
    return (
      <>
        <PageHeader titulo="Reporte no encontrado" regresar="/reportes/mis-reportes" />
        <EmptyState
          icono={SearchX}
          titulo="No encontramos este reporte"
          descripcion="Puede que se haya borrado al restablecer la demostración. Busca tus reportes por folio en «Mis reportes»."
          accion={
            <ButtonLink to="/reportes/mis-reportes" iconoInicio={ClipboardList}>
              Ir a Mis reportes
            </ButtonLink>
          }
        />
      </>
    );
  }

  const esPropio = reporte.identidadId === actor.id;
  const { ubicacion } = reporte;

  return (
    <>
      <PageHeader titulo={NOMBRE_CATEGORIA_REPORTE[reporte.categoria]} antetitulo="Detalle del reporte" regresar>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-lg font-semibold tracking-wide text-tinta" data-folio>
            {reporte.folio}
          </span>
          <DemoTag>Folio de demostración</DemoTag>
          {esPropio ? <Badge tono="marino">Tu reporte</Badge> : null}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="flex min-w-0 flex-col gap-5">
          <section aria-labelledby="estatus-reporte">
            <h2 id="estatus-reporte" className="mb-3 text-lg font-semibold text-marino">
              Estatus
            </h2>
            <EstadosReporte reporte={reporte} variante="detallada" />
          </section>

          <Card as="section" aria-labelledby="datos-reporte">
            <h2 id="datos-reporte" className="mb-3 text-lg font-semibold text-marino">
              Datos del reporte
            </h2>
            <KeyValueList
              items={[
                { id: "descripcion", clave: "Descripción", valor: reporte.descripcion },
                { id: "registro", clave: "Fecha de registro", valor: <time dateTime={reporte.creadoEn}>{formatearFechaHora(reporte.creadoEn)}</time> },
                {
                  id: "actualizacion",
                  clave: "Última actualización",
                  valor: <time dateTime={reporte.actualizadoEn}>{formatearFechaHora(reporte.actualizadoEn)}</time>,
                },
                { id: "riesgo", clave: "Riesgo para quienes transitan", valor: reporte.riesgoDeclarado ? "Declarado por quien reportó" : "No declarado" },
                { id: "foto", clave: "Fotografía", valor: reporte.tieneFoto ? "Se adjuntó una foto (la imagen no se guarda)" : "Sin foto" },
                { id: "autoria", clave: "Reportado por", valor: esPropio ? `Tú (${actor.nombre}, identidad ficticia)` : "Otra persona (ficticia)" },
              ]}
            />
            {reporte.asistencia?.resumen ? (
              <p className="mt-4 flex items-start gap-2 rounded-control bg-superficie-2 px-3 py-2.5 text-sm text-tinta">
                <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-marino" />
                <span>
                  <strong className="font-semibold">Resumen de la asistencia simulada: </strong>
                  {reporte.asistencia.resumen}
                </span>
              </p>
            ) : null}
          </Card>

          <AportacionesReporte reporte={reporte} identidadId={actor.id} />

          <Card as="section" aria-labelledby="historial-reporte">
            <h2 id="historial-reporte" className="mb-4 text-lg font-semibold text-marino">
              Línea de tiempo
            </h2>
            <HistorialReporte historial={reporte.historial} />
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Card as="section" aria-labelledby="ubicacion-reporte" className="flex flex-col gap-3">
            <h2 id="ubicacion-reporte" className="text-lg font-semibold text-marino">
              Ubicación
            </h2>
            <p className="flex items-start gap-2 text-[0.9375rem] text-tinta">
              <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-marino" />
              <span className="min-w-0 break-words">
                {ubicacion.referencia}
                {ubicacion.colonia ? `, ${ubicacion.colonia}` : ""}
              </span>
            </p>
            <p className="text-sm text-tinta-suave">
              {ETIQUETA_ORIGEN_UBICACION[ubicacion.origen]} · {formatearCoordenadas(ubicacion.lat, ubicacion.lng)}
            </p>
            <p className="text-sm text-tinta-suave">Incidencia de demostración: no corresponde a un incidente real.</p>
            <ButtonLink
              to={`/mapa?reporte=${encodeURIComponent(reporte.id)}`}
              variante="secundario"
              iconoInicio={MapPinned}
              className="self-start"
              data-guia="reportes.ver_en_mapa"
            >
              Ver en el mapa
            </ButtonLink>
          </Card>

          <VerificacionCiudadana reporte={reporte} identidadId={actor.id} />
        </div>
      </div>
    </>
  );
}
