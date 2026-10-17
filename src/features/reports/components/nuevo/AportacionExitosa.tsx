import { CircleCheckBig, Megaphone } from "lucide-react";
import { useEffect, useRef } from "react";
import { ReportCard } from "@/components/reportes/ReportCard";
import { ButtonLink } from "@/design-system";
import type { Reporte } from "@/types";

/** Resultado de «Es el mismo incidente: aportar información»: sin reporte nuevo y sin puntos. */
export function AportacionExitosa({ reporte }: { reporte: Reporte }) {
  const tituloRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    tituloRef.current?.focus();
  }, []);

  return (
    <section aria-labelledby="aportacion-exitosa" className="flex flex-col gap-5">
      <div className="rounded-tarjeta border border-exito/25 bg-exito-suave p-5">
        <div className="flex items-start gap-3">
          <CircleCheckBig aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-exito" />
          <div className="min-w-0">
            <h2 id="aportacion-exitosa" ref={tituloRef} tabIndex={-1} className="text-xl font-semibold text-exito outline-none">
              Aportaste información al reporte {reporte.folio}
            </h2>
            <p className="mt-2 text-[0.9375rem] text-tinta">
              Gracias. No se creó un reporte nuevo y las aportaciones no generan puntos: así no se premian los duplicados. Tu información
              ayuda a atender mejor el mismo incidente (simulación).
            </p>
          </div>
        </div>
      </div>
      <ReportCard reporte={reporte} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <ButtonLink to={`/reportes/${encodeURIComponent(reporte.id)}`} data-guia="reportes.ver_reporte_aportado">
          Ver el reporte
        </ButtonLink>
        <ButtonLink to="/reportes" variante="secundario" iconoInicio={Megaphone}>
          Volver a Reportes
        </ButtonLink>
      </div>
    </section>
  );
}
