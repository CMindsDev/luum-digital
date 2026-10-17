import { FlaskConical, Info, RotateCcw } from "lucide-react";
import { Button, Card, cx, DemoTag, ErrorState, formatearFechaHora, IntegrationBadge } from "@/design-system";
import { useRequestSupportDemo } from "@/services/hooks";
import type { SolicitudApoyoDemo } from "@/types";

export interface SolicitudSimuladaProps {
  tipo: SolicitudApoyoDemo["tipo"];
  titulo: string;
  /** Qué haría la solicitud en un servicio real y qué hacer para obtener atención real. */
  descripcion: string;
  /** Qué hacer para una atención real (se muestra junto al resultado). */
  atencionReal: string;
  nivel?: 2 | 3;
  guia?: string;
  className?: string;
}

/**
 * Solicitud de orientación SIMULADA (useRequestSupportDemo): no pide datos, no se envía a nadie,
 * no se guarda y nunca afirma que una persona la recibió ni que hay una cita.
 */
export function SolicitudSimulada({ tipo, titulo, descripcion, atencionReal, nivel = 3, guia, className }: SolicitudSimuladaProps) {
  const solicitud = useRequestSupportDemo();
  const Titulo = nivel === 2 ? "h2" : "h3";
  const resultado = solicitud.data;

  return (
    <Card as="section" tono="crema" className={cx("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        <DemoTag>Simulación</DemoTag>
        <IntegrationBadge estado="simulada" />
      </div>
      <Titulo className="text-lg font-semibold text-marino">{titulo}</Titulo>
      <p className="text-[0.9375rem] text-tinta">{descripcion}</p>
      <p className="flex items-start gap-2 text-sm text-tinta-suave">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>No pide datos personales, no envía alertas, ubicación ni mensajes, y no se guarda.</span>
      </p>

      {!resultado ? (
        <Button
          variante="secundario"
          iconoInicio={FlaskConical}
          onClick={() => solicitud.mutate(tipo)}
          cargando={solicitud.isPending}
          textoCargando="Simulando…"
          data-guia={guia}
        >
          Simular solicitud
        </Button>
      ) : null}

      {solicitud.isError ? (
        <ErrorState nivel={3} error={solicitud.error} titulo="No se pudo simular la solicitud" onReintentar={() => solicitud.mutate(tipo)} />
      ) : null}

      <div role="status" aria-live="polite">
        {resultado ? (
          <div className="space-y-2 rounded-tarjeta border border-ambar bg-ambar-suave px-4 py-3 text-tinta">
            <p className="font-semibold text-cafe">{resultado.leyenda}.</p>
            <p className="text-sm">
              Referencia de demostración: <span className="font-mono font-semibold">{resultado.referencia}</span> (no es un folio oficial) ·{" "}
              {formatearFechaHora(resultado.fecha)}
            </p>
            <p className="text-sm">No se envió nada: no hay cita, seguimiento ni persona asignada.</p>
            <p className="text-sm font-medium">{atencionReal}</p>
            <Button variante="fantasma" tamano="sm" iconoInicio={RotateCcw} onClick={() => solicitud.reset()}>
              Descartar simulación
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
