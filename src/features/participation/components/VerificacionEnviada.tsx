import { ClipboardList, Hourglass, Trophy } from "lucide-react";
import { useEffect, useRef } from "react";
import { ButtonLink, Card, KeyValueList } from "@/design-system";
import { calcularPuntosVerificacion, ETIQUETA_RESULTADO } from "@/domain/verificacion";
import { puntosEnTexto } from "@/features/rewards";
import { useRewardRules } from "@/services/hooks";
import type { Verificacion } from "@/types";
import { CriteriosCalidad } from "./CriteriosCalidad";
import { EstadoRevisionBadge } from "./EstadoRevisionBadge";

/** Confirmación de la verificación enviada: queda pendiente de revisión y no cambia el estado municipal. */
export function VerificacionEnviada({ verificacion }: { verificacion: Verificacion }) {
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const reglas = useRewardRules();
  const puntos = reglas.data ? calcularPuntosVerificacion(verificacion.resultado, verificacion.calidad, reglas.data) : null;

  useEffect(() => {
    tituloRef.current?.focus();
  }, []);

  return (
    <Card as="section" aria-labelledby="titulo-verificacion-enviada" relleno="lg" className="flex flex-col gap-4" data-guia="participacion.verificacion_enviada">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="inline-flex size-12 shrink-0 items-center justify-center rounded-boton bg-aviso-suave text-aviso">
          <Hourglass className="size-6" />
        </span>
        <div className="min-w-0">
          <h2 id="titulo-verificacion-enviada" ref={tituloRef} tabIndex={-1} className="text-xl font-semibold text-marino outline-none">
            Verificación enviada
          </h2>
          <p className="mt-1 text-[0.9375rem] text-tinta">
            Quedó <strong className="font-semibold">pendiente de revisión</strong> por el operador de demostración.
          </p>
        </div>
      </div>

      <KeyValueList
        items={[
          { id: "reporte", clave: "Reporte", valor: <span className="font-mono tracking-wide">{verificacion.reporteFolio}</span> },
          { id: "respuesta", clave: "Tu respuesta", valor: ETIQUETA_RESULTADO[verificacion.resultado] },
          { id: "calidad", clave: "Calidad", valor: <CriteriosCalidad calidad={verificacion.calidad} /> },
          { id: "revision", clave: "Revisión", valor: <EstadoRevisionBadge estado={verificacion.estadoRevision} /> },
          ...(puntos !== null
            ? [{ id: "puntos", clave: "Puntos", valor: `${puntosEnTexto(puntos)} pendientes: se suman sólo si se aprueba.` }]
            : []),
        ]}
      />

      <p className="rounded-control bg-superficie-2 px-3 py-2.5 text-sm text-tinta">
        Tu verificación es un dato aparte: el estado municipal del reporte no cambia. Un voto ciudadano nunca cierra ni reabre un reporte.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <ButtonLink to="/participacion" iconoInicio={Trophy} data-guia="participacion.volver">
          Ir a Participación
        </ButtonLink>
        <ButtonLink to={`/reportes/${encodeURIComponent(verificacion.reporteId)}`} variante="secundario" iconoInicio={ClipboardList}>
          Ver el reporte
        </ButtonLink>
      </div>
    </Card>
  );
}
