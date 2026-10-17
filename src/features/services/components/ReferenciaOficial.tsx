import { ExternalLink, Landmark } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cx, formatearFecha } from "@/design-system";
import type { Servicio } from "@/types";

export interface ReferenciaOficialProps {
  servicio: Servicio;
  className?: string;
}

/**
 * La gestión real sigue en el canal oficial. Este enlace es una referencia o alternativa, nunca
 * sustituye la pantalla interna del prototipo (y un enlace no es una integración).
 */
export function ReferenciaOficial({ servicio, className }: ReferenciaOficialProps) {
  const { t } = useTranslation();
  const { fuenteOficial: fuente } = servicio;
  return (
    <aside aria-labelledby={`referencia-${servicio.id}`} className={cx("rounded-tarjeta border border-borde bg-superficie-2 p-4 sm:p-5", className)}>
      <div className="flex items-start gap-3">
        <Landmark aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-marino" />
        <div className="min-w-0">
          <h2 id={`referencia-${servicio.id}`} className="text-base font-semibold text-marino">
            {t("¿Necesitas hacer el trámite real?")}
          </h2>
          <p className="mt-1 text-[0.9375rem] text-tinta">
            {t("Este prototipo no realiza gestiones oficiales. Para hacerlo de verdad, consulta la ficha oficial en {{sistema}}; ahí están los datos vigentes.", {
              sistema: servicio.sistemaDeOrigen,
            })}
          </p>
          <a
            href={fuente.url}
            target="_blank"
            rel="noopener noreferrer"
            data-guia="servicios.fuente_oficial"
            className="mt-2 inline-flex min-h-11 items-center gap-1.5 font-semibold break-words text-enlace underline underline-offset-2"
          >
            {fuente.nombre}
            <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
            <span className="sr-only">{t("(se abre en otra pestaña)")}</span>
          </a>
          <p className="text-sm text-tinta-suave">
            {t("Consultada el {{fecha}}", { fecha: formatearFecha(fuente.fechaConsulta, "media") })}
            {fuente.fechaActualizacionFuente ? t(" · actualizada por la fuente el {{fecha}}", { fecha: formatearFecha(fuente.fechaActualizacionFuente, "media") }) : ""}
          </p>
        </div>
      </div>
    </aside>
  );
}
