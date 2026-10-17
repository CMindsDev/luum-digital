import { ClipboardCheck, MessageSquareText } from "lucide-react";
import { Link } from "react-router";
import { Card, EmptyState, ErrorState, LoadingState, formatearFechaHora } from "@/design-system";
import { calcularPuntosVerificacion, ETIQUETA_RESULTADO } from "@/domain/verificacion";
import { puntosEnTexto } from "@/features/rewards";
import { useMyVerifications, useRewardRules } from "@/services/hooks";
import type { ReglasPuntosDemo, Verificacion } from "@/types";
import { ICONO_RESULTADO } from "../lib/verificacion";
import { CriteriosCalidad } from "./CriteriosCalidad";
import { EstadoRevisionBadge } from "./EstadoRevisionBadge";

/** Qué pasa con los puntos de la verificación según su revisión. */
function textoPuntos(verificacion: Verificacion, reglas: ReglasPuntosDemo | undefined): string {
  if (!reglas) return "";
  const puntos = puntosEnTexto(calcularPuntosVerificacion(verificacion.resultado, verificacion.calidad, reglas));
  switch (verificacion.estadoRevision) {
    case "pendiente_revision":
      return `${puntos} pendientes: se suman sólo si el operador de demostración la aprueba.`;
    case "aprobada":
      return `${puntos} acreditados una sola vez.`;
    case "rechazada":
      return "No suma puntos.";
    case "revertida":
      return `Se descontaron los ${puntos} que se habían acreditado.`;
  }
}

function TarjetaMiVerificacion({ verificacion, reglas }: { verificacion: Verificacion; reglas: ReglasPuntosDemo | undefined }) {
  const Icono = ICONO_RESULTADO[verificacion.resultado];
  return (
    <Card as="article" className="flex flex-col gap-2.5" data-verificacion-id={verificacion.id}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base leading-snug font-semibold text-marino">
          <Link to={`/reportes/${encodeURIComponent(verificacion.reporteId)}`} className="underline-offset-2 hover:underline">
            Verificación de <span className="font-mono tracking-wide">{verificacion.reporteFolio}</span>
          </Link>
        </h3>
        <EstadoRevisionBadge estado={verificacion.estadoRevision} />
      </div>
      <p className="flex items-center gap-2 text-[0.9375rem] font-medium text-tinta">
        <Icono aria-hidden="true" className="size-5 shrink-0 text-marino" />
        {ETIQUETA_RESULTADO[verificacion.resultado]}
      </p>
      {verificacion.comentario ? (
        <p className="flex items-start gap-2 text-sm text-tinta">
          <MessageSquareText aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-tinta-suave" />
          <span className="min-w-0 break-words">«{verificacion.comentario}»</span>
        </p>
      ) : null}
      <CriteriosCalidad calidad={verificacion.calidad} />
      {verificacion.motivoRevision ? (
        <p className="text-sm text-tinta">
          <strong className="font-semibold">Motivo de la revisión: </strong>
          {verificacion.motivoRevision}
        </p>
      ) : null}
      <p className="text-sm text-tinta-suave">
        Enviada el <time dateTime={verificacion.fecha}>{formatearFechaHora(verificacion.fecha)}</time>
      </p>
      {reglas ? <p className="text-sm font-medium text-tinta">{textoPuntos(verificacion, reglas)}</p> : null}
    </Card>
  );
}

/** Verificaciones enviadas por la identidad activa con su revisión y lo que pasa con sus puntos. */
export function MisVerificaciones() {
  const verificaciones = useMyVerifications();
  const reglas = useRewardRules();

  return (
    <section aria-labelledby="titulo-mis-verificaciones" className="flex flex-col gap-3" data-guia="participacion.mis_verificaciones">
      <h2 id="titulo-mis-verificaciones" className="text-xl font-semibold text-marino">
        Mis verificaciones
      </h2>
      {verificaciones.isPending ? (
        <LoadingState etiqueta="Cargando tus verificaciones…" />
      ) : verificaciones.isError ? (
        <ErrorState error={verificaciones.error} nivel={3} titulo="No pudimos cargar tus verificaciones" onReintentar={() => void verificaciones.refetch()} />
      ) : verificaciones.data.length === 0 ? (
        <EmptyState
          nivel={3}
          icono={ClipboardCheck}
          titulo="Aún no has verificado reparaciones"
          descripcion="Elige un reporte de la lista y cuéntanos qué observaste en el lugar."
        />
      ) : (
        <ul className="flex flex-col gap-3" aria-label="Verificaciones enviadas">
          {verificaciones.data.map((verificacion) => (
            <li key={verificacion.id}>
              <TarjetaMiVerificacion verificacion={verificacion} reglas={reglas.data} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
