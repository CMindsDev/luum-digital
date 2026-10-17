import { Bot, FileQuestion } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, useParams } from "react-router";
import { ETIQUETA_TIPO_RECORRIDO, EstadosServicio, rutaFicha } from "@/components/catalogo";
import { useService } from "@/services/hooks";
import { ButtonLink, DemoTag, EmptyState, ErrorState, LoadingState, PageHeader } from "@/design-system";
import { RecorridoServicio } from "../flows/RecorridoServicio";
import { leerPrefillTramite } from "../lib/prefill";

export default function StartServicePage() {
  const { t } = useTranslation();
  const { servicioId } = useParams();
  const location = useLocation();
  const { data: servicio, isPending, isError, error, refetch } = useService(servicioId);

  if (isPending) return <LoadingState etiqueta={t("Preparando el recorrido…")} />;
  if (isError) {
    return (
      <>
        <PageHeader titulo={t("Iniciar trámite")} regresar="/servicios" />
        <ErrorState error={error} onReintentar={() => void refetch()} />
      </>
    );
  }
  if (!servicio) {
    return (
      <>
        <PageHeader titulo={t("No encontramos este servicio")} regresar="/servicios" />
        <EmptyState
          icono={FileQuestion}
          titulo={t("El servicio no está en el catálogo del prototipo")}
          descripcion={t("Búscalo por su nombre en el catálogo.")}
          accion={<ButtonLink to="/servicios">{t("Ir al catálogo")}</ButtonLink>}
        />
      </>
    );
  }

  const prefill = leerPrefillTramite(location.state, servicio.id);

  return (
    <>
      <PageHeader
        regresar={rutaFicha(servicio.id)}
        etiquetaRegresar={t("Regresar a la ficha")}
        antetitulo={t(ETIQUETA_TIPO_RECORRIDO[servicio.tipoDeRecorrido])}
        titulo={servicio.nombre}
      >
        <div className="flex flex-col gap-3">
          <p className="flex flex-wrap items-center gap-2">
            <DemoTag>{t("Simulación: no realiza gestiones oficiales")}</DemoTag>
          </p>
          <EstadosServicio servicio={servicio} />
        </div>
      </PageHeader>

      {prefill ? (
        <div role="status" className="mb-5 flex items-start gap-3 rounded-tarjeta border border-magenta/40 bg-magenta-suave px-4 py-3">
          <Bot aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-magenta-tinta" />
          <p className="text-[0.9375rem] text-tinta">
            <strong className="font-semibold text-magenta-tinta">{t("Preparado por Pekito. ")}</strong>
            {t("Revisa y confirma cada paso: no se envió nada por ti.")}
          </p>
        </div>
      ) : null}

      <RecorridoServicio servicio={servicio} />
    </>
  );
}
