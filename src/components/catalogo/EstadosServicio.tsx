import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { InfoStatusBadge, IntegrationBadge, cx, formatearFecha } from "@/design-system";
import type { Servicio } from "@/types";

export interface EstadosServicioProps {
  servicio: Servicio;
  /** Explica cada eje debajo de su insignia (ficha del servicio). */
  conDescripcion?: boolean;
  /** Oculta la línea de la fuente (cuando la fuente ya se muestra en otro lugar). */
  sinFuente?: boolean;
  className?: string;
}

/**
 * Los dos ejes de cada servicio, siempre por separado: estado de la información
 * (verificada | pendiente | demostración) y estado de integración (simulada | conectada),
 * más la fuente oficial con su fecha de consulta.
 */
export function EstadosServicio({ servicio, conDescripcion = false, sinFuente = false, className }: EstadosServicioProps) {
  const { t } = useTranslation();
  const { fuenteOficial: fuente } = servicio;
  return (
    <div className={cx("flex flex-col gap-2", className)} data-estados-servicio="">
      {conDescripcion ? (
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="mb-1 text-xs font-semibold tracking-[0.08em] text-tinta-suave uppercase">{t("Información")}</dt>
            <dd>
              <InfoStatusBadge estado={servicio.estadoDeInformacion} conDescripcion />
            </dd>
          </div>
          <div>
            <dt className="mb-1 text-xs font-semibold tracking-[0.08em] text-tinta-suave uppercase">{t("Integración")}</dt>
            <dd>
              <IntegrationBadge estado={servicio.estadoDeIntegracion} conDescripcion />
            </dd>
          </div>
        </dl>
      ) : (
        <p className="flex flex-wrap gap-1.5">
          <InfoStatusBadge estado={servicio.estadoDeInformacion} />
          <IntegrationBadge estado={servicio.estadoDeIntegracion} />
        </p>
      )}
      {sinFuente ? null : (
        <p className="text-sm text-tinta-suave">
          <span className="font-semibold text-tinta">{t("Fuente:")} </span>
          <a
            href={fuente.url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 inline-flex items-center gap-1 font-medium break-words text-enlace underline underline-offset-2"
          >
            {fuente.nombre}
            <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="sr-only">{t("(se abre en otra pestaña)")}</span>
          </a>
          <span> · {t("consultada el")} {formatearFecha(fuente.fechaConsulta, "media")}</span>
        </p>
      )}
    </div>
  );
}
