import { CircleCheck, CircleX, ClipboardList, MapPin, ShieldCheck } from "lucide-react";
import { Link } from "react-router";
import { NOMBRE_CATEGORIA_REPORTE } from "@/domain/reportes";
import { Badge, Button, Card, StatusBadge, formatearFecha } from "@/design-system";
import type { Reporte } from "@/types";
import { ETIQUETA_NIVEL, ICONO_NIVEL, TONO_NIVEL, type ElementoCola } from "../lib/cola";
import { nombrePersona } from "../lib/personas";

export interface TarjetaReporteColaProps {
  elemento: ElementoCola;
  /** Bloquea las acciones (p. ej. sin conexión). */
  bloqueado: boolean;
  onValidar: (reporte: Reporte) => void;
  onAtender: (reporte: Reporte) => void;
  onCancelar: (reporte: Reporte) => void;
}

/** Reporte en la cola del operador: estado municipal, prioridad explicada y acciones permitidas. */
export function TarjetaReporteCola({ elemento, bloqueado, onValidar, onAtender, onCancelar }: TarjetaReporteColaProps) {
  const { reporte, prioridad } = elemento;
  const IconoNivel = ICONO_NIVEL[prioridad.nivel];
  const { referencia, colonia } = reporte.ubicacion;

  return (
    <Card as="article" className="flex flex-col gap-3" data-reporte={reporte.id} data-folio={reporte.folio}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base leading-snug font-semibold text-marino">
            {NOMBRE_CATEGORIA_REPORTE[reporte.categoria]} <span className="font-mono text-sm font-medium tracking-wide text-tinta">{reporte.folio}</span>
          </h3>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-tinta-suave">
            <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0 break-words">
              {referencia}
              {colonia ? ` · ${colonia}` : ""}
            </span>
          </p>
        </div>
        <StatusBadge estado={reporte.estadoMunicipal} />
      </div>

      <p className="line-clamp-2 text-[0.9375rem] text-tinta">{reporte.descripcion}</p>
      <p className="text-sm text-tinta-suave">
        Registrado el <time dateTime={reporte.creadoEn}>{formatearFecha(reporte.creadoEn)}</time> · {nombrePersona(reporte.identidadId)}
      </p>

      <div className="rounded-control border border-borde bg-superficie-2 px-3 py-2.5">
        <Badge tono={TONO_NIVEL[prioridad.nivel]} icono={IconoNivel}>
          {ETIQUETA_NIVEL[prioridad.nivel]}
        </Badge>
        {prioridad.criterios.length > 0 ? (
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-tinta" aria-label="Criterios de la prioridad">
            {prioridad.criterios.map((criterio) => (
              <li key={criterio.id}>{criterio.descripcion}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-tinta">Sin criterios de urgencia: riesgo no declarado, reciente y tipo sin riesgo inmediato.</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {reporte.estadoMunicipal === "registrado" ? (
          <Button tamano="sm" iconoInicio={ShieldCheck} disabled={bloqueado} onClick={() => onValidar(reporte)} data-guia={`operador.validar_${reporte.id}`}>
            Validar reporte<span className="sr-only"> {reporte.folio}</span>
          </Button>
        ) : (
          <Button
            tamano="sm"
            variante="exito"
            iconoInicio={CircleCheck}
            disabled={bloqueado}
            onClick={() => onAtender(reporte)}
            data-guia={`operador.registrar_atencion_${reporte.id}`}
          >
            Registrar atención<span className="sr-only"> de {reporte.folio}</span>
          </Button>
        )}
        <Button
          tamano="sm"
          variante="fantasma"
          iconoInicio={CircleX}
          disabled={bloqueado}
          onClick={() => onCancelar(reporte)}
          data-guia={`operador.cancelar_${reporte.id}`}
        >
          Cancelar con motivo<span className="sr-only"> {reporte.folio}</span>
        </Button>
        <Link
          to={`/reportes/${encodeURIComponent(reporte.id)}`}
          className="inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-semibold text-enlace underline underline-offset-2"
        >
          <ClipboardList aria-hidden="true" className="size-4" />
          Ver detalle<span className="sr-only"> de {reporte.folio}</span>
        </Link>
      </div>
    </Card>
  );
}
