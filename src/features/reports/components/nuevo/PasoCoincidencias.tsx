import { ArrowLeft, ArrowRight, CopyCheck, MessageSquarePlus, SearchCheck } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { ReportCard } from "@/components/reportes/ReportCard";
import { Button, ErrorState, LoadingState } from "@/design-system";
import type { PosibleDuplicado, Reporte } from "@/types";
import { AportacionForm } from "../AportacionForm";

export interface PasoCoincidenciasProps {
  cargando: boolean;
  error: unknown;
  coincidencias: PosibleDuplicado[] | undefined;
  onReintentar: () => void;
  /** Descripción y foto del formulario, para prellenar la aportación. */
  descripcion: string;
  tieneFoto: boolean;
  onAportado: (reporte: Reporte) => void;
  onContinuar: () => void;
  onRegresar: () => void;
}

/**
 * Paso 4: posibles duplicados (como «Solicitud existente» de Reporta en línea). La persona decide:
 * «Es el mismo incidente: aportar información» (no crea reporte ni puntos) o «Es otro incidente: continuar».
 */
export function PasoCoincidencias({
  cargando,
  error,
  coincidencias,
  onReintentar,
  descripcion,
  tieneFoto,
  onAportado,
  onContinuar,
  onRegresar,
}: PasoCoincidenciasProps) {
  const [aportandoA, setAportandoA] = useState<Reporte | null>(null);
  const idTituloAportar = useId();
  const tituloAportarRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (aportandoA) tituloAportarRef.current?.focus();
  }, [aportandoA]);

  const regresar = (
    <Button variante="secundario" iconoInicio={ArrowLeft} onClick={onRegresar}>
      Regresar
    </Button>
  );

  if (cargando) return <LoadingState etiqueta="Buscando reportes iguales cerca…" variante="tarjetas" />;

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <ErrorState error={error} nivel={3} onReintentar={onReintentar} titulo="No pudimos revisar si ya lo reportaron" />
        <div className="flex">{regresar}</div>
      </div>
    );
  }

  const lista = coincidencias ?? [];

  if (aportandoA) {
    return (
      <section aria-labelledby={idTituloAportar} className="flex flex-col gap-4">
        <h3 ref={tituloAportarRef} id={idTituloAportar} tabIndex={-1} className="text-lg font-semibold text-marino outline-none">
          Aportar información al reporte {aportandoA.folio}
        </h3>
        <ReportCard reporte={aportandoA} compacta enlace={false} nivelTitulo={4} />
        <AportacionForm
          reporte={aportandoA}
          descripcionInicial={descripcion}
          tieneFotoInicial={tieneFoto}
          onAportado={onAportado}
          onCancelar={() => setAportandoA(null)}
        />
      </section>
    );
  }

  if (lista.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3 rounded-tarjeta border border-exito/25 bg-exito-suave px-4 py-4">
          <SearchCheck aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-exito" />
          <div className="text-[0.9375rem] text-tinta">
            <p className="font-semibold text-exito">No encontramos reportes iguales abiertos cerca.</p>
            <p className="mt-1">
              Revisamos reportes del mismo tipo, registrados o en proceso de atención, a 60 m o en la misma calle y colonia, de los últimos 45 días.
            </p>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          {regresar}
          <Button iconoFin={ArrowRight} onClick={onContinuar} data-guia="reportes.continuar">
            Continuar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3 rounded-tarjeta border border-ambar bg-aviso-suave px-4 py-3">
        <CopyCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-aviso" />
        <p className="text-[0.9375rem] text-tinta">
          {lista.length === 1
            ? "Encontramos 1 reporte abierto que podría ser el mismo incidente."
            : `Encontramos ${lista.length} reportes abiertos que podrían ser el mismo incidente.`}{" "}
          Si es el mismo, aporta información en lugar de duplicarlo: así se atiende mejor.
        </p>
      </div>
      <ul className="flex flex-col gap-4">
        {lista.map(({ reporte, motivo }, indice) => (
          <li key={reporte.id} className="flex flex-col gap-3 rounded-tarjeta border border-borde bg-superficie-2 p-3">
            <ReportCard reporte={reporte} compacta enlace={false} />
            <p className="px-1 text-sm text-tinta">
              <span className="font-semibold">Por qué podría ser el mismo: </span>
              {motivo}
            </p>
            <Button
              iconoInicio={MessageSquarePlus}
              onClick={() => setAportandoA(reporte)}
              anchoCompleto
              aria-label={`Es el mismo incidente: aportar información al reporte ${reporte.folio}`}
              data-guia={indice === 0 ? "reportes.aportar_informacion" : undefined}
            >
              Es el mismo incidente: aportar información
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        {regresar}
        <Button variante="secundario" iconoFin={ArrowRight} onClick={onContinuar} data-guia="reportes.es_otro_incidente">
          Es otro incidente: continuar
        </Button>
      </div>
    </div>
  );
}
