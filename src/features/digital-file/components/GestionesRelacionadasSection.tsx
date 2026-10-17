import { BookUser, ChevronRight, ClipboardList, FileText, LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge, ButtonLink, Card, DemoTag, EmptyState, ErrorState, formatearFecha, LoadingState } from "@/design-system";
import { useDocuments, useProcedures } from "@/services/hooks";
import { rutaDocumento } from "../lib/documentos";
import { ESTADO_GESTION, gestionesRelacionadas, rutaGestion } from "../lib/gestiones";
import { EncabezadoSeccion } from "./EncabezadoSeccion";

/**
 * Gestiones simuladas que usaron datos del expediente (con confirmación) o que tienen documentos
 * de ejemplo ligados. Muestra qué datos se reutilizaron en cada una.
 */
export function GestionesRelacionadasSection() {
  const { t } = useTranslation();
  const gestiones = useProcedures();
  const documentos = useDocuments();
  const cargando = gestiones.isPending || documentos.isPending;
  const error = gestiones.error ?? documentos.error;
  const relacionadas = gestiones.data && documentos.data ? gestionesRelacionadas(gestiones.data, documentos.data) : [];

  const reintentar = () => {
    if (gestiones.isError) void gestiones.refetch();
    if (documentos.isError) void documentos.refetch();
  };

  return (
    <Card as="section" id="gestiones" aria-labelledby="titulo-gestiones-relacionadas" relleno="lg" data-guia="expediente.gestiones">
      <EncabezadoSeccion
        id="titulo-gestiones-relacionadas"
        icono={ClipboardList}
        rotulo={t("Seguimiento")}
        titulo={t("Gestiones relacionadas")}
        descripcion={t("Gestiones simuladas donde usaste datos o documentos de tu expediente.")}
        extra={<DemoTag>{t("Simuladas")}</DemoTag>}
      />

      {cargando && !error ? <LoadingState etiqueta={t("Cargando tus gestiones…")} variante="compacto" /> : null}

      {error ? <ErrorState error={error} nivel={3} titulo={t("No pudimos cargar tus gestiones")} onReintentar={reintentar} /> : null}

      {!cargando && !error && relacionadas.length === 0 ? (
        <EmptyState
          nivel={3}
          icono={ClipboardList}
          titulo={t("Aún no usas tu expediente en una gestión")}
          descripcion={t("Cuando copies datos de tu expediente en un trámite simulado, aquí verás cuáles usaste.")}
          accion={
            <ButtonLink to="/servicios" variante="secundario" tamano="sm" iconoInicio={LayoutGrid}>
              {t("Explorar trámites")}
            </ButtonLink>
          }
          className="py-6"
        />
      ) : null}

      {relacionadas.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {relacionadas.map(({ gestion, reutilizados, documentos: ligados }) => {
            const estado = ESTADO_GESTION[gestion.estado];
            return (
              <li key={gestion.id} className="rounded-boton border border-borde p-4" data-gestion-id={gestion.id}>
                <Link
                  to={rutaGestion(gestion.id)}
                  className="group flex min-h-11 items-start justify-between gap-3 rounded-control font-semibold text-tinta no-underline hover:text-marino"
                >
                  <span className="min-w-0 break-words">{gestion.servicioNombre}</span>
                  <ChevronRight aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-tinta-suave transition-transform group-hover:translate-x-0.5" />
                </Link>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-tinta-suave">
                  <Badge tono={estado.tono} icono={estado.icono}>
                    <span className="sr-only">{t("Estado: ")}</span>
                    {t(estado.etiqueta)}
                  </Badge>
                  <span className="font-mono text-[0.8125rem] font-medium text-tinta">{gestion.folio ?? t("Sin folio (borrador)")}</span>
                  <span>
                    {t("Actualizada el ")}<time dateTime={gestion.actualizadaEn}>{formatearFecha(gestion.actualizadaEn)}</time>
                  </span>
                </p>

                {reutilizados.length > 0 ? (
                  <div className="mt-3">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-exito">
                      <BookUser aria-hidden="true" className="size-4 shrink-0" />
                      {t("Datos de tu expediente que usaste")}
                    </p>
                    <ul className="mt-1.5 flex flex-col gap-1 text-[0.9375rem]">
                      {reutilizados.map((dato) => (
                        <li key={dato.nombre} className="break-words text-tinta">
                          <span className="font-medium">{t(dato.etiqueta)}:</span>{" "}
                          {dato.valor ?? <span className="text-tinta-suave">{t("sin valor guardado")}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-tinta-suave">{t("No usaste datos de tu expediente en esta gestión.")}</p>
                )}

                {ligados.length > 0 ? (
                  <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-tinta-suave">
                    <FileText aria-hidden="true" className="size-4 shrink-0" />
                    <span>{t("Documentos ligados:")}</span>
                    {ligados.map((documento, indice) => (
                      <span key={documento.id}>
                        <Link to={rutaDocumento(documento.id)} className="font-medium text-enlace underline underline-offset-2">
                          {t(documento.titulo)}
                        </Link>
                        {indice < ligados.length - 1 ? "," : null}
                      </span>
                    ))}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      <ButtonLink to="/gestiones" variante="fantasma" tamano="sm" iconoFin={ChevronRight} className="mt-3" data-guia="expediente.ver_gestiones">
        {t("Ver todas mis gestiones")}
      </ButtonLink>
    </Card>
  );
}
