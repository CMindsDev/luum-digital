import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge, Card, InfoStatusBadge, cx } from "@/design-system";
import type { Servicio } from "@/types";
import { ETIQUETA_TIPO_RECORRIDO, ICONO_TIPO_RECORRIDO, rutaFicha } from "./etiquetas";
import { EstadosServicio } from "./EstadosServicio";
import { MosaicoCategoria } from "./MosaicoCategoria";
import { useCategoria } from "./useCategoria";

export interface ServiceCardProps {
  servicio: Servicio;
  /** Fila compacta (resultados de búsqueda, listas largas, respuestas del asistente). */
  compacta?: boolean;
  /** Nivel del título en la tarjeta completa (h3 por omisión). */
  nivelTitulo?: 2 | 3 | 4;
  className?: string;
}

/**
 * Tarjeta de servicio del catálogo (Figma 12:64 adaptado): mosaico de la categoría, nombre,
 * dependencia, estados de información e integración y acceso a la ficha interna.
 * Toda la tarjeta es clicable, pero el único enlace es «Ver ficha» (sin enlaces duplicados).
 */
export function ServiceCard({ servicio, compacta = false, nivelTitulo = 3, className }: ServiceCardProps) {
  const { t } = useTranslation();
  const categoria = useCategoria(servicio.categoria);
  const ruta = rutaFicha(servicio.id);

  if (compacta) {
    return (
      <Link
        to={ruta}
        data-servicio-id={servicio.id}
        className={cx(
          "group flex min-h-16 items-center gap-3 rounded-tarjeta border border-borde bg-superficie p-3 text-left no-underline shadow-suave",
          "transition-[box-shadow,transform] duration-(--duracion-media) ease-suave hover:shadow-elevada motion-safe:hover:-translate-y-0.5",
          className,
        )}
      >
        <MosaicoCategoria categoria={categoria} tamano="sm" />
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 leading-snug font-semibold text-marino">{servicio.nombre}</span>
          {servicio.dependencia ? <span className="mt-0.5 block truncate text-sm text-tinta-suave">{servicio.dependencia}</span> : null}
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            <InfoStatusBadge estado={servicio.estadoDeInformacion} />
          </span>
        </span>
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-marino transition-transform group-hover:translate-x-0.5" />
      </Link>
    );
  }

  const Titulo = `h${nivelTitulo}` as const;
  const IconoTipo = ICONO_TIPO_RECORRIDO[servicio.tipoDeRecorrido];
  return (
    <Card as="article" interactiva relleno="md" data-servicio-id={servicio.id} className={cx("relative flex h-full flex-col gap-3", className)}>
      <div className="flex items-start gap-3">
        <MosaicoCategoria categoria={categoria} />
        <div className="min-w-0 flex-1">
          <Titulo className="line-clamp-3 text-base leading-snug font-semibold text-marino">{servicio.nombre}</Titulo>
          {servicio.dependencia ? <p className="mt-0.5 line-clamp-2 text-sm text-tinta-suave">{servicio.dependencia}</p> : null}
        </div>
      </div>
      <p className="line-clamp-3 text-[0.9375rem] text-tinta">{servicio.descripcion}</p>
      <div className="flex flex-wrap gap-1.5">
        <Badge tono="neutro" icono={IconoTipo}>
          {t(ETIQUETA_TIPO_RECORRIDO[servicio.tipoDeRecorrido])}
        </Badge>
      </div>
      <EstadosServicio servicio={servicio} sinFuente />
      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        <Link
          to={ruta}
          className={cx(
            "inline-flex min-h-11 items-center gap-1.5 rounded-pildora bg-cafe px-4 text-sm font-semibold text-white no-underline",
            "transition-colors hover:bg-marino",
            // El área clicable cubre toda la tarjeta; el foco visible queda en el botón.
            "after:absolute after:inset-0 after:rounded-tarjeta after:content-['']",
          )}
        >
          {t("Ver ficha")}
          <span className="sr-only"> {t("de {{nombre}}", { nombre: servicio.nombre })}</span>
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
        {servicio.clave ? <span className="text-xs font-medium tracking-[0.05em] text-tinta-suave uppercase">{servicio.clave}</span> : null}
      </div>
    </Card>
  );
}
