import { ClipboardList, MapPinned } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
  ButtonLink,
  Card,
  ErrorState,
  ICONO_ESTADO_MUNICIPAL,
  SectionLabel,
  Skeleton,
} from "@/design-system";
import { useMyReports } from "@/services/hooks";
import { ETIQUETA_FILTRO_ESTADO_MUNICIPAL_UI } from "../../lib/i18n";
import { contarPorEstado, ORDEN_ESTADOS } from "../../lib/mis-reportes";
import { BuscarFolioForm } from "../BuscarFolioForm";

/** Acceso a «Mis reportes» con el conteo por estatus y «Buscar por folio». */
export function ResumenMisReportes() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mios = useMyReports();
  const conteo = mios.data ? contarPorEstado(mios.data) : null;

  return (
    <section aria-labelledby="mis-reportes-resumen">
      <SectionLabel id="mis-reportes-resumen" className="mb-3">
        {t("Mis reportes")}
      </SectionLabel>
      <Card className="flex flex-col gap-4">
        {mios.isPending ? (
          <div role="status" aria-label={t("Cargando tus reportes")} className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
            <Skeleton forma="bloque" className="h-16" />
            <Skeleton forma="bloque" className="h-16" />
            <Skeleton forma="bloque" className="h-16" />
            <Skeleton forma="bloque" className="h-16" />
          </div>
        ) : mios.isError ? (
          <ErrorState error={mios.error} nivel={3} onReintentar={() => void mios.refetch()} titulo={t("No pudimos cargar tus reportes")} />
        ) : conteo ? (
          <>
            <p className="text-[0.9375rem] text-tinta">
              {mios.data.length === 0
                ? t("Todavía no tienes reportes. Cuando hagas uno, aquí verás su estatus.")
                : mios.data.length === 1
                  ? t("Tienes 1 reporte de demostración.")
                  : t("Tienes {{n}} reportes de demostración.", { n: mios.data.length })}
            </p>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
              {ORDEN_ESTADOS.map((estado) => {
                const Icono = ICONO_ESTADO_MUNICIPAL[estado];
                return (
                  <li key={estado} className="flex items-center gap-2 rounded-control border border-borde bg-superficie-2 px-3 py-2.5">
                    <Icono aria-hidden="true" className="size-4 shrink-0 text-tinta-suave" />
                    <span className="min-w-0 flex-1 text-sm leading-snug text-tinta">{t(ETIQUETA_FILTRO_ESTADO_MUNICIPAL_UI[estado])}</span>
                    <span className="rounded-pildora bg-superficie px-2 text-sm font-semibold text-marino">{conteo[estado]}</span>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <ButtonLink to="/reportes/mis-reportes" iconoInicio={ClipboardList} data-guia="reportes.mis_reportes">
            {t("Ver mis reportes")}
          </ButtonLink>
          <ButtonLink to="/mapa" variante="secundario" iconoInicio={MapPinned} data-guia="reportes.ver_mapa">
            {t("Ver reportes en el mapa")}
          </ButtonLink>
        </div>
        <BuscarFolioForm
          className="border-t border-borde pt-4"
          onBuscar={(folio) => navigate(`/reportes/mis-reportes?folio=${encodeURIComponent(folio)}`)}
        />
      </Card>
    </section>
  );
}
