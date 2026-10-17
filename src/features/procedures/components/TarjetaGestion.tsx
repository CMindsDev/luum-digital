import { ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { ETIQUETA_TIPO_RECORRIDO, ICONO_TIPO_RECORRIDO } from "@/components/catalogo";
import { Card, formatearFechaHora } from "@/design-system";
import type { Gestion } from "@/types";
import { EstadoGestionBadge } from "./EstadoGestionBadge";

export interface TarjetaGestionProps {
  gestion: Gestion;
  nivelTitulo?: 3 | 4;
}

/** Gestión simulada en la lista: servicio, folio DEMO-G (o borrador), estado y última actualización. */
export function TarjetaGestion({ gestion, nivelTitulo = 3 }: TarjetaGestionProps) {
  const Titulo = `h${nivelTitulo}` as const;
  const IconoTipo = ICONO_TIPO_RECORRIDO[gestion.tipo];
  return (
    <Card as="article" interactiva relleno="md" className="relative flex h-full flex-col gap-3" data-gestion-id={gestion.id}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <EstadoGestionBadge estado={gestion.estado} />
        <span className="text-sm font-semibold tracking-[0.04em] text-tinta">{gestion.folio ?? "Sin folio (borrador)"}</span>
      </div>
      <Titulo className="line-clamp-3 text-base leading-snug font-semibold text-marino">{gestion.servicioNombre}</Titulo>
      <p className="flex items-center gap-1.5 text-sm text-tinta-suave">
        <IconoTipo aria-hidden="true" className="size-4 shrink-0" />
        {ETIQUETA_TIPO_RECORRIDO[gestion.tipo]}
      </p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        <p className="text-sm text-tinta-suave">
          Actualizada el <time dateTime={gestion.actualizadaEn}>{formatearFechaHora(gestion.actualizadaEn)}</time>
        </p>
        <Link
          to={`/gestiones/${encodeURIComponent(gestion.id)}`}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-pildora px-3 text-sm font-semibold text-enlace underline-offset-2 after:absolute after:inset-0 after:rounded-tarjeta after:content-[''] hover:underline"
        >
          Ver detalle
          <span className="sr-only"> de {gestion.folio ?? "el borrador"}: {gestion.servicioNombre}</span>
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </Card>
  );
}
