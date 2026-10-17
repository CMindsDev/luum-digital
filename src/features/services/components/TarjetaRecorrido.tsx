import { ArrowRight, PenLine } from "lucide-react";
import {
  ACCION_TIPO_RECORRIDO,
  DESCRIPCION_TIPO_RECORRIDO,
  ETIQUETA_TIPO_RECORRIDO,
  ICONO_TIPO_RECORRIDO,
  rutaRecorrido,
} from "@/components/catalogo";
import { useProcedures } from "@/services/hooks";
import { ButtonLink, Card, DemoTag, formatearFechaHora } from "@/design-system";
import type { Servicio } from "@/types";

export interface TarjetaRecorridoProps {
  servicio: Servicio;
}

/**
 * Llamado a la acción de la ficha: abre el recorrido interno del servicio (siempre simulado).
 * Si la persona tiene un borrador de este servicio, ofrece continuarlo.
 */
export function TarjetaRecorrido({ servicio }: TarjetaRecorridoProps) {
  const gestiones = useProcedures();
  const borrador = gestiones.data?.find((gestion) => gestion.servicioId === servicio.id && gestion.estado === "borrador");
  const Icono = ICONO_TIPO_RECORRIDO[servicio.tipoDeRecorrido];

  return (
    <Card as="aside" aria-labelledby="titulo-recorrido" relleno="lg" tono="marino" className="relative overflow-hidden">
      <div className="flex items-center gap-2.5">
        <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-boton bg-lima-logo text-marino">
          <Icono className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.12em] text-white uppercase">Recorrido en la app</p>
          <h2 id="titulo-recorrido" className="text-lg font-semibold text-white">
            {ETIQUETA_TIPO_RECORRIDO[servicio.tipoDeRecorrido]}
          </h2>
        </div>
      </div>
      <p className="mt-3 text-[0.9375rem] text-white">{DESCRIPCION_TIPO_RECORRIDO[servicio.tipoDeRecorrido]}</p>
      <div className="mt-3">
        <DemoTag>Simulación: no es una gestión oficial</DemoTag>
      </div>
      <div className="mt-5 flex flex-col gap-2.5">
        <ButtonLink to={rutaRecorrido(servicio.id)} variante="acento" tamano="lg" anchoCompleto iconoFin={ArrowRight} data-guia="servicios.iniciar">
          {ACCION_TIPO_RECORRIDO[servicio.tipoDeRecorrido]}
        </ButtonLink>
        {borrador ? (
          <ButtonLink
            to={`${rutaRecorrido(servicio.id)}?borrador=${encodeURIComponent(borrador.id)}`}
            variante="secundario"
            anchoCompleto
            iconoInicio={PenLine}
            data-guia="servicios.continuar_borrador"
          >
            Continuar mi borrador
          </ButtonLink>
        ) : null}
        {borrador ? (
          <p className="text-sm text-white">Borrador guardado el {formatearFechaHora(borrador.actualizadaEn)}.</p>
        ) : null}
      </div>
    </Card>
  );
}
