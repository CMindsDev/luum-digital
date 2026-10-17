import { DemoTag, IntegrationBadge, PageHeader } from "@/design-system";
import { useTranslation } from "react-i18next";
import { CatalogoReportes } from "../components/hub/CatalogoReportes";
import { ComoFunciona } from "../components/hub/ComoFunciona";
import { ReportesRapidos } from "../components/hub/ReportesRapidos";
import { ResumenMisReportes } from "../components/hub/ResumenMisReportes";

/** /reportes — «Reportes rápidos», «Catálogo de reportes» y «Mis reportes» (estructura de Mérida Móvil). */
export default function ReportsHubPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        destacado
        antetitulo={t("Reporta y da seguimiento")}
        titulo={t("Reportes")}
        descripcion={t(
          "Avisa de baches, luminarias, rejillas tapadas y más. En este prototipo los reportes se simulan: reciben un folio DEMO y no llegan al Ayuntamiento.",
        )}
      >
        <div className="flex flex-wrap gap-2">
          <IntegrationBadge estado="simulada" />
          <DemoTag>{t("Datos ficticios")}</DemoTag>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-8">
        <ReportesRapidos />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
          <CatalogoReportes />
          <div className="flex flex-col gap-8">
            <ResumenMisReportes />
            <ComoFunciona />
          </div>
        </div>
      </div>
    </>
  );
}
