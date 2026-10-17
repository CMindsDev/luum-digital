import { Gift, ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ButtonLink, DemoTag, PageHeader } from "@/design-system";
import { ResumenPuntos } from "@/features/rewards";
import { ComoFunciona } from "../components/ComoFunciona";
import { MisVerificaciones } from "../components/MisVerificaciones";
import { ReportesPorVerificar } from "../components/ReportesPorVerificar";

/**
 * /participacion — reportes que la identidad activa puede verificar (nunca los propios), sus
 * verificaciones y el resumen de puntos (pendientes y aprobados por separado).
 */
export default function ParticipationPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader
        destacado
        antetitulo={t("Participa")}
        titulo={t("Participación y recompensas")}
        descripcion={t("Verifica reparaciones de reportes de otras personas y suma puntos de demostración. Se premia la calidad, no la respuesta positiva.")}
      >
        <DemoTag>{t("Puntos de demostración")}</DemoTag>
      </PageHeader>

      <div className="flex flex-col gap-8">
        <ResumenPuntos
          acciones={
            <>
              <ButtonLink to="/participacion/recompensas" iconoInicio={Gift} data-guia="participacion.ver_recompensas">
                {t("Ver recompensas")}
              </ButtonLink>
              <ButtonLink to="/participacion/reglas" variante="secundario" iconoInicio={ListChecks} data-guia="participacion.ver_reglas">
                {t("Reglas de puntos")}
              </ButtonLink>
            </>
          }
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-6">
          <div className="flex min-w-0 flex-col gap-8">
            <ReportesPorVerificar />
            <MisVerificaciones />
          </div>
          <div className="min-w-0">
            <ComoFunciona />
          </div>
        </div>
      </div>
    </>
  );
}
