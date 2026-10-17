import { BadgeCheck, CircleX, Coins, MessageSquareText, RefreshCcw, Undo2 } from "lucide-react";
import { Link } from "react-router";
import { Button, Card } from "@/design-system";
import { calcularPuntosVerificacion, claveEventoVerificacion, ETIQUETA_RESULTADO } from "@/domain/verificacion";
import { CriteriosCalidad, EstadoRevisionBadge, ICONO_RESULTADO } from "@/features/participation";
import { formatearPuntosConSigno } from "@/features/rewards";
import type { ReglasPuntosDemo, Verificacion } from "@/types";
import { nombrePersona } from "../lib/personas";

export interface TarjetaRevisionProps {
  verificacion: Verificacion;
  reglas: ReglasPuntosDemo | undefined;
  /** Identidad activa (no puede revisar su propia verificación). */
  actorId: string;
  bloqueado: boolean;
  repitiendo: boolean;
  onAprobar: (verificacion: Verificacion) => void;
  onRechazar: (verificacion: Verificacion) => void;
  onRevertir: (verificacion: Verificacion) => void;
  onRepetirAprobacion: (verificacion: Verificacion) => void;
}

/** Movimiento de puntos asociado a la verificación: una sola clave de evento, un solo crédito. */
function MovimientoAsociado({ verificacion, reglas }: { verificacion: Verificacion; reglas: ReglasPuntosDemo | undefined }) {
  if (!reglas) return null;
  const puntos = calcularPuntosVerificacion(verificacion.resultado, verificacion.calidad, reglas);
  const texto: Record<Verificacion["estadoRevision"], string> = {
    pendiente_revision: `${formatearPuntosConSigno(puntos)} pendientes: no suman hasta aprobar.`,
    aprobada: `${formatearPuntosConSigno(puntos)} acreditados una sola vez.`,
    rechazada: `${formatearPuntosConSigno(puntos)} cancelados: no suman.`,
    revertida: `${formatearPuntosConSigno(puntos)} acreditados y ${formatearPuntosConSigno(-puntos)} revertidos con motivo.`,
  };
  return (
    <div className="flex items-start gap-2 rounded-control border border-borde bg-superficie-2 px-3 py-2.5 text-sm text-tinta">
      <Coins aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-marino" />
      <p className="min-w-0">
        <strong className="font-semibold">Movimiento de puntos: </strong>
        {texto[verificacion.estadoRevision]}{" "}
        <span className="text-tinta-suave">
          Clave de evento única <code className="font-mono break-all">{claveEventoVerificacion(verificacion.id)}</code>
        </span>
      </p>
    </div>
  );
}

/** Verificación ciudadana en revisión: quién, qué respondió, calidad, puntos y acciones permitidas. */
export function TarjetaRevision({
  verificacion,
  reglas,
  actorId,
  bloqueado,
  repitiendo,
  onAprobar,
  onRechazar,
  onRevertir,
  onRepetirAprobacion,
}: TarjetaRevisionProps) {
  const Icono = ICONO_RESULTADO[verificacion.resultado];
  const propia = verificacion.identidadId === actorId;
  const deshabilitado = bloqueado || propia;
  const folio = verificacion.reporteFolio;

  return (
    <Card as="article" className="flex flex-col gap-3" data-verificacion-id={verificacion.id} data-folio={folio}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base leading-snug font-semibold text-marino">
          Verificación de <span className="font-mono tracking-wide">{folio}</span>
        </h3>
        <EstadoRevisionBadge estado={verificacion.estadoRevision} />
      </div>
      <p className="text-sm text-tinta-suave">{nombrePersona(verificacion.identidadId)}</p>
      <p className="flex items-center gap-2 text-[0.9375rem] font-medium text-tinta">
        <Icono aria-hidden="true" className="size-5 shrink-0 text-marino" />
        {ETIQUETA_RESULTADO[verificacion.resultado]}
      </p>
      {verificacion.comentario ? (
        <p className="flex items-start gap-2 text-sm text-tinta">
          <MessageSquareText aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-tinta-suave" />
          <span className="min-w-0 break-words">«{verificacion.comentario}»</span>
        </p>
      ) : (
        <p className="text-sm text-tinta-suave">Sin comentario.</p>
      )}
      <CriteriosCalidad calidad={verificacion.calidad} />
      <MovimientoAsociado verificacion={verificacion} reglas={reglas} />
      {verificacion.motivoRevision ? (
        <p className="text-sm text-tinta">
          <strong className="font-semibold">Motivo registrado: </strong>
          {verificacion.motivoRevision}
        </p>
      ) : null}
      {propia ? <p className="text-sm font-medium text-aviso">No puedes revisar una verificación que tú enviaste.</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        {verificacion.estadoRevision === "pendiente_revision" ? (
          <>
            <Button
              tamano="sm"
              variante="exito"
              iconoInicio={BadgeCheck}
              disabled={deshabilitado}
              onClick={() => onAprobar(verificacion)}
              data-guia={`operador.aprobar_${verificacion.id}`}
            >
              Aprobar<span className="sr-only"> la verificación de {folio}</span>
            </Button>
            <Button
              tamano="sm"
              variante="fantasma"
              iconoInicio={CircleX}
              disabled={deshabilitado}
              onClick={() => onRechazar(verificacion)}
              data-guia={`operador.rechazar_${verificacion.id}`}
            >
              Rechazar con motivo<span className="sr-only"> la verificación de {folio}</span>
            </Button>
          </>
        ) : null}
        {verificacion.estadoRevision === "aprobada" ? (
          <>
            <Button
              tamano="sm"
              variante="fantasma"
              iconoInicio={Undo2}
              disabled={deshabilitado}
              onClick={() => onRevertir(verificacion)}
              data-guia={`operador.revertir_${verificacion.id}`}
            >
              Revertir con motivo<span className="sr-only"> la verificación de {folio}</span>
            </Button>
            <Button
              tamano="sm"
              variante="secundario"
              iconoInicio={RefreshCcw}
              disabled={deshabilitado}
              cargando={repitiendo}
              onClick={() => onRepetirAprobacion(verificacion)}
              data-guia={`operador.repetir_aprobacion_${verificacion.id}`}
            >
              Repetir aprobación<span className="sr-only"> de {folio}</span>
            </Button>
          </>
        ) : null}
        <Link
          to={`/reportes/${encodeURIComponent(verificacion.reporteId)}`}
          className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-enlace underline underline-offset-2"
        >
          Ver reporte<span className="sr-only"> {folio}</span>
        </Link>
      </div>
    </Card>
  );
}
