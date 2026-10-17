import { Sparkles } from "lucide-react";

/** Aviso cuando el asistente preparó el formulario: la persona revisa y confirma; nada se envía solo. */
export function AvisoAsistente() {
  return (
    <div role="status" className="mb-5 flex items-start gap-3 rounded-tarjeta border border-azul/25 bg-azul-suave px-4 py-3">
      <Sparkles aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-azul" />
      <div className="min-w-0 text-[0.9375rem] text-tinta">
        <p className="font-semibold text-marino">Preparado por el asistente: revisa y confirma</p>
        <p className="mt-0.5">
          Pekito llenó algunos campos con lo que le dijiste. Corrige lo que haga falta: nada se envía hasta que tú lo confirmes.
        </p>
      </div>
    </div>
  );
}
