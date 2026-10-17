import { ChevronRight, Camera, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { NOMBRE_CATEGORIA_REPORTE } from "@/domain/reportes";
import { Card, cx, formatearFecha } from "@/design-system";
import type { Reporte } from "@/types";
import {
  CLASES_ICONO_CATEGORIA,
  ICONO_CATEGORIA_REPORTE,
  TONO_CATEGORIA_REPORTE,
  describirUbicacionCorta,
} from "./categorias-reporte";
import { EstadosReporte } from "./EstadosReporte";

export interface ReportCardProps {
  reporte: Reporte;
  /** Versión breve para listas densas (sin descripción). */
  compacta?: boolean;
  /** Si es false, la tarjeta no enlaza al detalle (p. ej. dentro de un formulario en curso). */
  enlace?: boolean;
  /** Nivel del encabezado de la tarjeta (h3 por omisión). */
  nivelTitulo?: 2 | 3 | 4;
  className?: string;
}

/**
 * Tarjeta de reporte: tipo, folio DEMO, ubicación, fecha y los dos ejes de estado
 * (municipal y verificación ciudadana). Toda la tarjeta enlaza a /reportes/:id.
 */
export function ReportCard({ reporte, compacta = false, enlace = true, nivelTitulo = 3, className }: ReportCardProps) {
  const { t } = useTranslation();
  const Icono = ICONO_CATEGORIA_REPORTE[reporte.categoria];
  const tono = TONO_CATEGORIA_REPORTE[reporte.categoria];
  const nombre = t(NOMBRE_CATEGORIA_REPORTE[reporte.categoria]);
  const Titulo = `h${nivelTitulo}` as const;

  return (
    <Card
      as="article"
      relleno={compacta ? "sm" : "md"}
      interactiva={enlace}
      data-reporte={reporte.id}
      className={cx(
        "relative",
        enlace && "has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-foco",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cx("inline-flex shrink-0 items-center justify-center rounded-boton", compacta ? "size-10" : "size-12", CLASES_ICONO_CATEGORIA[tono])}
        >
          <Icono className={compacta ? "size-5" : "size-6"} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <Titulo className="text-base leading-snug font-semibold text-marino">
            {enlace ? (
              <Link
                to={`/reportes/${encodeURIComponent(reporte.id)}`}
                className="no-underline outline-none after:absolute after:inset-0 after:rounded-tarjeta after:content-['']"
              >
                {nombre}
                <span className="sr-only">{t(", folio {{folio}}", { folio: reporte.folio })}</span>
              </Link>
            ) : (
              nombre
            )}
          </Titulo>
          <p className="mt-0.5 font-mono text-sm font-medium tracking-wide text-tinta">{reporte.folio}</p>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-tinta-suave">
            <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0 break-words">{describirUbicacionCorta(reporte.ubicacion)}</span>
          </p>
          {compacta ? null : <p className="mt-2 line-clamp-2 text-[0.9375rem] text-tinta">{reporte.descripcion}</p>}
          <EstadosReporte reporte={reporte} className="mt-3" />
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-tinta-suave">
            <span>
              {t("Registrado el")} <time dateTime={reporte.creadoEn}>{formatearFecha(reporte.creadoEn)}</time>
            </span>
            {reporte.tieneFoto ? (
              <span className="inline-flex items-center gap-1">
                <Camera aria-hidden="true" className="size-3.5" />
                {t("Con foto")}
              </span>
            ) : null}
            {reporte.aportaciones.length > 0 ? (
              <span>
                {t("{{n}} {{etiqueta}}", {
                  n: reporte.aportaciones.length,
                  etiqueta: reporte.aportaciones.length === 1 ? t("aportación") : t("aportaciones"),
                })}
              </span>
            ) : null}
          </p>
        </div>
        {enlace ? <ChevronRight aria-hidden="true" className="mt-1 size-5 shrink-0 text-tinta-suave" /> : null}
      </div>
    </Card>
  );
}
