import { ClipboardList, FileX, FolderOpen, Info } from "lucide-react";
import { Link, useParams } from "react-router";
import {
  Badge,
  ButtonLink,
  Card,
  DemoTag,
  EmptyState,
  ErrorState,
  formatearFecha,
  KeyValueList,
  LoadingState,
  PageHeader,
} from "@/design-system";
import { useDocument, useProcedures } from "@/services/hooks";
import { VistaPreviaDocumento } from "../components/VistaPreviaDocumento";
import { TIPO_DOCUMENTO } from "../lib/documentos";
import { ESTADO_GESTION, rutaGestion } from "../lib/gestiones";

/**
 * /expediente/documentos/:documentoId — vista previa de un documento FICTICIO con la marca
 * «DOCUMENTO DE EJEMPLO», sus datos y las gestiones simuladas en que se usó. No se descarga ni se envía.
 */
export default function DocumentoPage() {
  const { documentoId } = useParams();
  const documento = useDocument(documentoId);
  const gestiones = useProcedures();

  if (documento.isPending) {
    return (
      <>
        <PageHeader titulo="Documento de ejemplo" regresar="/expediente" etiquetaRegresar="Volver a mi expediente" />
        <LoadingState etiqueta="Cargando el documento de ejemplo…" />
      </>
    );
  }

  if (documento.isError) {
    return (
      <>
        <PageHeader titulo="Documento de ejemplo" regresar="/expediente" etiquetaRegresar="Volver a mi expediente" />
        <ErrorState error={documento.error} titulo="No pudimos cargar el documento" onReintentar={() => void documento.refetch()} />
      </>
    );
  }

  if (!documento.data) {
    return (
      <>
        <PageHeader titulo="Documento no encontrado" regresar="/expediente" etiquetaRegresar="Volver a mi expediente" />
        <EmptyState
          icono={FileX}
          titulo="No encontramos este documento"
          descripcion="Puede que pertenezca a otra identidad de demostración o que se haya restablecido la demostración."
          accion={
            <ButtonLink to="/expediente" iconoInicio={FolderOpen}>
              Ir a mi expediente
            </ButtonLink>
          }
        />
      </>
    );
  }

  const doc = documento.data;
  const ligadas = gestiones.data?.filter((gestion) => doc.gestionesRelacionadas.includes(gestion.id)) ?? [];

  return (
    <>
      <PageHeader titulo={doc.titulo} antetitulo="Documento de ejemplo" regresar="/expediente" etiquetaRegresar="Volver a mi expediente">
        <div className="flex flex-wrap items-center gap-2">
          <DemoTag>Documento ficticio</DemoTag>
          <Badge tono="neutro" icono={Info}>
            Sin validez oficial
          </Badge>
        </div>
      </PageHeader>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
        <VistaPreviaDocumento documento={doc} className="min-w-0" />

        <div className="flex min-w-0 flex-col gap-5">
          <Card as="section" aria-labelledby="titulo-datos-documento" relleno="md">
            <h2 id="titulo-datos-documento" className="mb-3 text-lg font-semibold text-marino">
              Datos del documento
            </h2>
            <KeyValueList
              disposicion="apilada"
              items={[
                { id: "tipo", clave: "Tipo", valor: TIPO_DOCUMENTO[doc.tipo].etiqueta },
                { id: "fecha", clave: "Fecha de ejemplo", valor: formatearFecha(doc.fecha, "media") },
                { id: "origen", clave: "Origen", valor: "Generado por la demostración" },
              ]}
            />
            <p className="mt-4 border-t border-borde pt-3 text-sm text-tinta-suave">
              No se puede descargar ni enviar. Ni el asistente ni ningún trámite simulado envían documentos.
            </p>
          </Card>

          <Card as="section" aria-labelledby="titulo-gestiones-documento" relleno="md" data-guia="expediente.documento_gestiones">
            <h2 id="titulo-gestiones-documento" className="mb-3 text-lg font-semibold text-marino">
              Gestiones donde se usó
            </h2>
            {gestiones.isPending ? <LoadingState etiqueta="Cargando gestiones…" variante="compacto" /> : null}
            {gestiones.isError ? (
              <ErrorState error={gestiones.error} nivel={3} titulo="No pudimos cargar tus gestiones" onReintentar={() => void gestiones.refetch()} />
            ) : null}
            {gestiones.isSuccess && ligadas.length === 0 ? (
              <p className="text-[0.9375rem] text-tinta-suave">Este documento no está ligado a ninguna gestión simulada.</p>
            ) : null}
            {ligadas.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {ligadas.map((gestion) => {
                  const estado = ESTADO_GESTION[gestion.estado];
                  return (
                    <li key={gestion.id}>
                      <Link
                        to={rutaGestion(gestion.id)}
                        className="flex min-h-11 flex-col gap-1.5 rounded-boton border border-borde p-3 no-underline hover:bg-superficie-2"
                      >
                        <span className="flex items-start gap-2 font-medium break-words text-tinta">
                          <ClipboardList aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-azul" />
                          {gestion.servicioNombre}
                        </span>
                        <span className="flex flex-wrap items-center gap-2 text-sm text-tinta-suave">
                          <Badge tono={estado.tono} icono={estado.icono}>
                            <span className="sr-only">Estado: </span>
                            {estado.etiqueta}
                          </Badge>
                          <span className="font-mono text-[0.8125rem] font-medium text-tinta">{gestion.folio ?? "Sin folio (borrador)"}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </Card>
        </div>
      </div>
    </>
  );
}
