import { FileText, Plus } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { useActiveIdentity } from "@/app/session/store";
import { ButtonLink, Card, Chip, EmptyState, ErrorState, LoadingState, PageHeader, formatearFecha } from "@/design-system";
import { useReports } from "@/services/hooks";
import type { EstadoMunicipal } from "@/types";
import { BuscarFolioForm } from "../components/BuscarFolioForm";
import { FiltroFechasForm } from "../components/mis-reportes/FiltroFechasForm";
import { FolioFueraDeMisReportes } from "../components/mis-reportes/FolioFueraDeMisReportes";
import { GrupoEstado } from "../components/mis-reportes/GrupoEstado";
import { aFiltroReportes, agruparPorEstado, escribirFiltros, leerFiltros, ORDEN_ESTADOS, type FiltrosMisReportes } from "../lib/mis-reportes";

/**
 * /reportes/mis-reportes — «Fecha inicio», «Fecha fin», «Filtrar resultados», «Buscar por folio» y
 * los reportes agrupados por estatus (Registrado, En proceso de atención, Solucionado, Motivo de
 * cancelación) con su contador, como en Mérida Móvil. Los filtros viven en la URL.
 */
export default function MyReportsPage() {
  const actor = useActiveIdentity();
  const [parametros, setParametros] = useSearchParams();
  const filtros = leerFiltros(parametros);
  const consulta = useReports(aFiltroReportes(filtros, actor.id));
  const [abiertos, setAbiertos] = useState<Partial<Record<EstadoMunicipal, boolean>>>({});

  const aplicar = (cambios: Partial<FiltrosMisReportes>) => {
    setAbiertos({});
    setParametros(escribirFiltros({ ...filtros, ...cambios }), { replace: true });
  };

  const conFiltros = Boolean(filtros.desde || filtros.hasta || filtros.folio);
  const reportes = consulta.data ?? [];
  const grupos = agruparPorEstado(reportes);

  return (
    <>
      <PageHeader
        titulo="Mis reportes"
        regresar="/reportes"
        descripcion={`Reportes de demostración de ${actor.nombre} (identidad ficticia).`}
        accion={
          <ButtonLink to="/reportes" tamano="sm" iconoInicio={Plus} variante="secundario">
            Nuevo reporte
          </ButtonLink>
        }
      />

      <Card className="mb-5 flex flex-col gap-4">
        <FiltroFechasForm desde={filtros.desde} hasta={filtros.hasta} onFiltrar={(valores) => aplicar(valores)} />
        <BuscarFolioForm key={filtros.folio} valorInicial={filtros.folio} onBuscar={(folio) => aplicar({ folio })} className="border-t border-borde pt-4" />
        {conFiltros ? (
          <div className="flex flex-wrap items-center gap-2" aria-label="Filtros aplicados" role="group">
            {filtros.desde ? (
              <Chip onQuitar={() => aplicar({ desde: "" })} etiquetaQuitar="Quitar fecha inicio">
                Desde {formatearFecha(filtros.desde)}
              </Chip>
            ) : null}
            {filtros.hasta ? (
              <Chip onQuitar={() => aplicar({ hasta: "" })} etiquetaQuitar="Quitar fecha fin">
                Hasta {formatearFecha(filtros.hasta)}
              </Chip>
            ) : null}
            {filtros.folio ? (
              <Chip onQuitar={() => aplicar({ folio: "" })} etiquetaQuitar="Quitar búsqueda por folio">
                Folio: {filtros.folio}
              </Chip>
            ) : null}
          </div>
        ) : null}
      </Card>

      {consulta.isPending ? (
        <LoadingState etiqueta="Cargando tus reportes…" variante="tarjetas" />
      ) : consulta.isError ? (
        <ErrorState error={consulta.error} onReintentar={() => void consulta.refetch()} titulo="No pudimos cargar tus reportes" />
      ) : reportes.length === 0 && filtros.folio ? (
        <FolioFueraDeMisReportes folio={filtros.folio} />
      ) : reportes.length === 0 ? (
        <EmptyState
          icono={FileText}
          titulo={conFiltros ? "No tienes reportes en este periodo" : "Todavía no tienes reportes"}
          descripcion={
            conFiltros ? "Prueba con otras fechas o quita los filtros." : "Cuando reportes un bache, una luminaria u otro problema, aquí verás su estatus."
          }
          accion={
            <ButtonLink to="/reportes" iconoInicio={Plus}>
              Hacer un reporte
            </ButtonLink>
          }
        />
      ) : (
        <div className="flex flex-col gap-3" aria-busy={consulta.isFetching || undefined}>
          <p className="text-sm text-tinta-suave" role="status">
            {reportes.length} {reportes.length === 1 ? "reporte" : "reportes"}
            {conFiltros ? " con los filtros aplicados" : ""}.
          </p>
          {ORDEN_ESTADOS.map((estado) => (
            <GrupoEstado
              key={estado}
              estado={estado}
              reportes={grupos[estado]}
              abierto={abiertos[estado] ?? grupos[estado].length > 0}
              onAlternar={() => setAbiertos((previo) => ({ ...previo, [estado]: !(previo[estado] ?? grupos[estado].length > 0) }))}
            />
          ))}
        </div>
      )}
    </>
  );
}
