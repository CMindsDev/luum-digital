import { ExternalLink } from "lucide-react";
import { useEffect, useRef } from "react";
import { cx } from "@/design-system";
import type { MensajeConversacion } from "@/features/assistant/runtime";

export interface MensajesAcompananteProps {
  mensajes: readonly MensajeConversacion[];
  /** El proveedor está preparando una respuesta. */
  pensando: boolean;
}

/**
 * Registro de la conversación (role="log"). Los mensajes sólo existen en memoria; esta vista no los
 * copia a ningún otro lugar.
 */
export function MensajesAcompanante({ mensajes, pensando }: MensajesAcompananteProps) {
  const finalRef = useRef<HTMLDivElement>(null);
  const cantidad = mensajes.length;

  // Mantiene visible el último mensaje dentro del registro (sin mover el foco).
  useEffect(() => {
    const final = finalRef.current;
    const registro = final?.parentElement;
    if (final && registro) registro.scrollTop = registro.scrollHeight;
  }, [cantidad, pensando]);

  return (
    <div
      role="log"
      aria-label="Conversación con el acompañante de demostración"
      aria-live="polite"
      aria-relevant="additions"
      tabIndex={0}
      className="max-h-[26rem] min-h-32 space-y-3 overflow-y-auto rounded-tarjeta border border-borde bg-superficie p-3 sm:p-4"
    >
      {mensajes.length === 0 ? (
        <p className="py-6 text-center text-sm text-tinta-suave">Aquí aparecerá la conversación. Puedes empezar con una de las opciones o escribir.</p>
      ) : null}
      {mensajes.map((mensaje) => {
        const propio = mensaje.rol === "persona";
        return (
          <div key={mensaje.id} className={cx("flex", propio ? "justify-end" : "justify-start")}>
            <div
              className={cx(
                "max-w-[85%] rounded-tarjeta px-4 py-2.5 text-[0.9375rem] leading-relaxed whitespace-pre-wrap",
                propio ? "rounded-br-md bg-marino text-white" : "rounded-bl-md bg-azul-suave text-tinta",
              )}
            >
              <span className="sr-only">{propio ? "Tú: " : "Acompañante (simulación): "}</span>
              {!propio ? (
                <span aria-hidden="true" className="mb-0.5 block text-xs font-semibold tracking-[0.06em] text-tinta-suave uppercase">
                  Acompañante · simulación
                </span>
              ) : null}
              {mensaje.texto}
              {mensaje.fuentes && mensaje.fuentes.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm">
                  {mensaje.fuentes.map((fuente) =>
                    fuente.url ? (
                      <li key={`${fuente.titulo}-${fuente.url}`}>
                        <a href={fuente.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-enlace underline underline-offset-2">
                          {fuente.titulo}
                          <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
                          <span className="sr-only">(se abre en otra pestaña)</span>
                        </a>
                      </li>
                    ) : (
                      <li key={fuente.titulo}>{fuente.titulo}</li>
                    ),
                  )}
                </ul>
              ) : null}
            </div>
          </div>
        );
      })}
      {pensando ? (
        <p role="status" className="text-sm text-tinta-suave">
          Preparando una respuesta programada…
        </p>
      ) : null}
      <div ref={finalRef} />
    </div>
  );
}
