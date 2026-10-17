import { SearchX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ReportCard } from "@/components/reportes/ReportCard";
import { EmptyState, ErrorState, LoadingState } from "@/design-system";
import { useReportByFolio } from "@/services/hooks";

/**
 * Cuando el folio buscado no está entre tus reportes: lo busca entre todos los reportes de
 * demostración (p. ej. uno al que aportaste información). Nunca inventa un folio.
 */
export function FolioFueraDeMisReportes({ folio }: { folio: string }) {
  const { t } = useTranslation();
  const consulta = useReportByFolio(folio);

  if (consulta.isPending && consulta.fetchStatus !== "idle") return <LoadingState etiqueta={t("Buscando el folio…")} variante="compacto" />;
  if (consulta.isError) return <ErrorState error={consulta.error} nivel={2} onReintentar={() => void consulta.refetch()} />;
  if (consulta.data) {
    return (
      <section aria-labelledby="folio-de-otra-persona" className="flex flex-col gap-3">
        <h2 id="folio-de-otra-persona" className="text-lg font-semibold text-marino">
          {t("Este folio no está entre tus reportes")}
        </h2>
        <p className="text-[0.9375rem] text-tinta">{t("Es un reporte de demostración de otra persona. Puedes consultar su estatus:")}</p>
        <ReportCard reporte={consulta.data} />
      </section>
    );
  }
  return (
    <EmptyState
      icono={SearchX}
      titulo={t("No encontramos el folio {{folio}}", { folio })}
      descripcion={t("Revisa que esté bien escrito. Los folios de este prototipo empiezan con DEMO-R- (por ejemplo, DEMO-R-0000001).")}
    />
  );
}
