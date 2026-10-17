import { cx } from "@/design-system";
import type { PasoServicio } from "@/types";
import { AvisoPendiente } from "./AvisoPendiente";

const ETIQUETA_CANAL_PASO: Record<NonNullable<PasoServicio["canal"]>, string> = {
  en_linea: "En línea",
  presencial: "Presencial",
  telefonico: "Por teléfono",
};

export interface SeccionPasosProps {
  pasos: readonly PasoServicio[] | null;
  className?: string;
}

/** Pasos publicados por la fuente, en orden (o «Pendiente de verificar»). */
export function SeccionPasos({ pasos, className }: SeccionPasosProps) {
  if (pasos === null) return <AvisoPendiente que="los pasos" className={className} />;
  if (pasos.length === 0) return <p className={cx("text-tinta", className)}>La fuente no publica pasos para este servicio.</p>;
  const ordenados = [...pasos].sort((a, b) => a.orden - b.orden);
  return (
    <ol className={cx("flex flex-col gap-3", className)}>
      {ordenados.map((paso) => (
        <li key={`${paso.orden}-${paso.titulo}`} className="flex items-start gap-3">
          <span aria-hidden="true" className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-marino text-sm font-bold text-white">
            {paso.orden}
          </span>
          <div className="min-w-0 pt-1">
            <p className="font-semibold text-tinta">
              <span className="sr-only">Paso {paso.orden}: </span>
              {paso.titulo}
            </p>
            {paso.canal ? <p className="text-sm text-tinta-suave">{ETIQUETA_CANAL_PASO[paso.canal]}</p> : null}
            {paso.descripcion && paso.descripcion.trim().toLowerCase() !== (paso.canal ? ETIQUETA_CANAL_PASO[paso.canal].toLowerCase() : "") ? (
              <p className="text-[0.9375rem] text-tinta">{paso.descripcion}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
