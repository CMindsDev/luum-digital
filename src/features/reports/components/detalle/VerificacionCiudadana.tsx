import { ScanSearch } from "lucide-react";
import { useTranslation } from "react-i18next";
import { evaluarElegibilidad } from "@/domain/verificacion";
import { ButtonLink, Card, VerificationBadge } from "@/design-system";
import { useReportVerifications } from "@/services/hooks";
import type { Reporte } from "@/types";

/**
 * Eje de verificación ciudadana del reporte (propuesta del prototipo). Sólo enlaza a verificar si
 * aplica: atención reportada, reporte ajeno y sin verificación previa de esta identidad.
 */
export function VerificacionCiudadana({ reporte, identidadId }: { reporte: Reporte; identidadId: string }) {
  const { t } = useTranslation();
  const verificaciones = useReportVerifications(reporte.id);
  const lista = verificaciones.data ?? [];
  const elegibilidad = verificaciones.data ? evaluarElegibilidad(reporte, identidadId, lista) : null;
  const aprobadas = lista.filter((verificacion) => verificacion.estadoRevision === "aprobada").length;

  return (
    <Card as="section" aria-labelledby="verificacion-ciudadana" className="flex flex-col gap-3">
      <h2 id="verificacion-ciudadana" className="text-lg font-semibold text-marino">
        {t("Verificación ciudadana")}
      </h2>
      <div>
        <VerificationBadge estado={reporte.verificacion} />
      </div>
      <p className="text-[0.9375rem] text-tinta">
        {reporte.estadoMunicipal === "solucionado"
          ? t("El Ayuntamiento (simulado) reportó la atención. Otras personas pueden comprobar en el lugar si quedó resuelto.")
          : t("Cuando el Ayuntamiento reporte la atención, otras personas podrán verificar si quedó resuelto.")}{" "}
        {t("Un voto ciudadano nunca cierra ni reabre el reporte.")}
      </p>
      {verificaciones.isSuccess && lista.length > 0 ? (
        <p className="text-sm text-tinta-suave">
          {lista.length === 1 ? t("1 verificación recibida") : t("{{n}} verificaciones recibidas", { n: lista.length })} ·{" "}
          {aprobadas === 1 ? t("1 aprobada") : t("{{n}} aprobadas", { n: aprobadas })} {t("por el operador de demostración.")}
        </p>
      ) : null}
      {verificaciones.isError ? <p className="text-sm text-tinta-suave">{t("No pudimos cargar las verificaciones de este reporte.")}</p> : null}
      {elegibilidad?.elegible ? (
        <ButtonLink
          to={`/participacion/verificar/${encodeURIComponent(reporte.id)}`}
          iconoInicio={ScanSearch}
          className="self-start"
          data-guia="reportes.verificar"
        >
          {t("Verificar la reparación")}
        </ButtonLink>
      ) : elegibilidad && reporte.estadoMunicipal === "solucionado" ? (
        <p className="text-sm text-tinta-suave">{t(elegibilidad.motivo)}</p>
      ) : null}
    </Card>
  );
}
