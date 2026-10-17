import { ScanSearch } from "lucide-react";
import { evaluarElegibilidad } from "@/domain/verificacion";
import { ButtonLink, Card, VerificationBadge } from "@/design-system";
import { useReportVerifications } from "@/services/hooks";
import type { Reporte } from "@/types";

/**
 * Eje de verificación ciudadana del reporte (propuesta del prototipo). Sólo enlaza a verificar si
 * aplica: atención reportada, reporte ajeno y sin verificación previa de esta identidad.
 */
export function VerificacionCiudadana({ reporte, identidadId }: { reporte: Reporte; identidadId: string }) {
  const verificaciones = useReportVerifications(reporte.id);
  const lista = verificaciones.data ?? [];
  const elegibilidad = verificaciones.data ? evaluarElegibilidad(reporte, identidadId, lista) : null;
  const aprobadas = lista.filter((verificacion) => verificacion.estadoRevision === "aprobada").length;

  return (
    <Card as="section" aria-labelledby="verificacion-ciudadana" className="flex flex-col gap-3">
      <h2 id="verificacion-ciudadana" className="text-lg font-semibold text-marino">
        Verificación ciudadana
      </h2>
      <div>
        <VerificationBadge estado={reporte.verificacion} />
      </div>
      <p className="text-[0.9375rem] text-tinta">
        {reporte.estadoMunicipal === "solucionado"
          ? "El Ayuntamiento (simulado) reportó la atención. Otras personas pueden comprobar en el lugar si quedó resuelto."
          : "Cuando el Ayuntamiento reporte la atención, otras personas podrán verificar si quedó resuelto."}{" "}
        Un voto ciudadano nunca cierra ni reabre el reporte.
      </p>
      {verificaciones.isSuccess && lista.length > 0 ? (
        <p className="text-sm text-tinta-suave">
          {lista.length} {lista.length === 1 ? "verificación recibida" : "verificaciones recibidas"} · {aprobadas}{" "}
          {aprobadas === 1 ? "aprobada" : "aprobadas"} por el operador de demostración.
        </p>
      ) : null}
      {verificaciones.isError ? <p className="text-sm text-tinta-suave">No pudimos cargar las verificaciones de este reporte.</p> : null}
      {elegibilidad?.elegible ? (
        <ButtonLink
          to={`/participacion/verificar/${encodeURIComponent(reporte.id)}`}
          iconoInicio={ScanSearch}
          className="self-start"
          data-guia="reportes.verificar"
        >
          Verificar la reparación
        </ButtonLink>
      ) : elegibilidad && reporte.estadoMunicipal === "solucionado" ? (
        <p className="text-sm text-tinta-suave">{elegibilidad.motivo}</p>
      ) : null}
    </Card>
  );
}
