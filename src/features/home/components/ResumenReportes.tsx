import { ChevronRight, Construction, Megaphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ReportCard } from "@/components/reportes/ReportCard";
import { ButtonLink, Card, DemoTag, EmptyState, ErrorState, LoadingState } from "@/design-system";
import { useMyReports } from "@/services/hooks";

const MAXIMO = 2;

/** Resumen de «Mis reportes» (demostración) de la identidad activa: los más recientes primero. */
export function ResumenReportes() {
  const { t } = useTranslation();
  const reportes = useMyReports();
  const lista = reportes.data ? [...reportes.data].sort((a, b) => b.actualizadoEn.localeCompare(a.actualizadoEn)) : [];
  const recientes = lista.slice(0, MAXIMO);

  return (
    <Card as="section" aria-labelledby="titulo-resumen-reportes" relleno="md" className="flex min-w-0 flex-col" data-guia="inicio.resumen_reportes">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 id="titulo-resumen-reportes" className="flex items-center gap-2 text-lg font-semibold text-marino">
          <Megaphone aria-hidden="true" className="size-5 text-azul" />
          {t("Mis reportes")}
        </h3>
        <DemoTag />
      </div>

      {reportes.isPending ? <LoadingState etiqueta={t("Cargando tus reportes…")} variante="compacto" /> : null}

      {reportes.isError ? <ErrorState error={reportes.error} nivel={3} onReintentar={() => void reportes.refetch()} /> : null}

      {reportes.isSuccess && lista.length === 0 ? (
        <EmptyState
          nivel={3}
          icono={Megaphone}
          titulo={t("Aún no tienes reportes")}
          descripcion={t("Reporta un bache, una luminaria o basura en la vía pública y sigue su estado aquí.")}
          accion={
            <ButtonLink to="/reportes/nuevo/bache" variante="secundario" tamano="sm" iconoInicio={Construction}>
              {t("Reportar un bache")}
            </ButtonLink>
          }
          className="py-6"
        />
      ) : null}

      {reportes.isSuccess && lista.length > 0 ? (
        <ul className="space-y-3">
          {recientes.map((reporte) => (
            <li key={reporte.id}>
              <ReportCard reporte={reporte} compacta nivelTitulo={4} />
            </li>
          ))}
        </ul>
      ) : null}

      {reportes.isSuccess && lista.length > 0 ? (
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <ButtonLink to="/reportes/mis-reportes" variante="secundario" tamano="sm" iconoFin={ChevronRight} data-guia="inicio.ver_reportes">
            {lista.length > recientes.length ? t("Ver mis {{total}} reportes", { total: lista.length }) : t("Ver mis reportes")}
          </ButtonLink>
        </div>
      ) : null}
    </Card>
  );
}
