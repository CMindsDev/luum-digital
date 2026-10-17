import { StatusBadge, VerificationBadge, cx } from "@/design-system";
import type { Reporte } from "@/types";

export interface EstadosReporteProps {
  reporte: Pick<Reporte, "estadoMunicipal" | "motivoCancelacion" | "verificacion">;
  /**
   * insignias (por omisión): las dos insignias en línea.
   * detallada: cada eje con su etiqueta visible y una explicación breve.
   */
  variante?: "insignias" | "detallada";
  className?: string;
}

const EXPLICACION_MUNICIPAL = "Lo que informa el Ayuntamiento (simulado en este prototipo).";
const EXPLICACION_VERIFICACION = "Lo que observan otras personas tras la atención. Un voto ciudadano nunca cierra un reporte.";

/**
 * Los dos ejes de un reporte, siempre separados y con ícono + texto: el estado municipal
 * (Registrado, En proceso de atención, Solucionado, Cancelado) y la verificación ciudadana.
 */
export function EstadosReporte({ reporte, variante = "insignias", className }: EstadosReporteProps) {
  if (variante === "detallada") {
    return (
      <dl className={cx("grid gap-3 sm:grid-cols-2", className)}>
        <div className="rounded-control border border-borde bg-superficie p-3">
          <dt className="text-sm font-semibold text-tinta-suave">Estado municipal</dt>
          <dd className="mt-1.5">
            <StatusBadge estado={reporte.estadoMunicipal} motivo={reporte.motivoCancelacion} tamano="md" />
            <p className="mt-1.5 text-sm text-tinta-suave">{EXPLICACION_MUNICIPAL}</p>
          </dd>
        </div>
        <div className="rounded-control border border-borde bg-superficie p-3">
          <dt className="text-sm font-semibold text-tinta-suave">Verificación ciudadana</dt>
          <dd className="mt-1.5">
            <VerificationBadge estado={reporte.verificacion} />
            <p className="mt-1.5 text-sm text-tinta-suave">{EXPLICACION_VERIFICACION}</p>
          </dd>
        </div>
      </dl>
    );
  }
  // «Coincide» o «Discrepancia» solos son ambiguos: llevan el prefijo visible.
  const conPrefijo = reporte.verificacion === "coincide" || reporte.verificacion === "discrepancia" || reporte.verificacion === "no_concluyente";
  return (
    <div className={cx("flex flex-wrap items-center gap-2", className)}>
      <StatusBadge estado={reporte.estadoMunicipal} motivo={reporte.motivoCancelacion} />
      <VerificationBadge estado={reporte.verificacion} conPrefijo={conPrefijo} />
    </div>
  );
}
