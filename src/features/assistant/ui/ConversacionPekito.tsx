import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { msg } from "@/i18n";
import { useAsistenteStore } from "../runtime/store";
import type { AccionAviso } from "./AvisoPekito";
import { CompositorPekito } from "./CompositorPekito";
import { ListaAvisosPekito } from "./ListaAvisosPekito";
import { lineaDeTiempo, SUGERENCIAS_PEKITO } from "./linea-de-tiempo";
import { MensajePekito } from "./MensajePekito";
import { PekitoMascota } from "./PekitoMascota";
import { TarjetaRecibo } from "./TarjetaRecibo";
import { useEstadoMascota } from "./useEstadoMascota";

function Pensando({ texto }: { texto: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2.5 text-sm text-(--pk-texto-suave)">
      <PekitoMascota ancho={28} estado="pensando" className="shrink-0 opacity-80" />
      <span>{t(texto)}</span>
      <span aria-hidden="true" className="flex gap-1">
        <span className="pekito-punto size-1.5 rounded-full bg-(--pk-lima)" />
        <span className="pekito-punto size-1.5 rounded-full bg-(--pk-lima)" />
        <span className="pekito-punto size-1.5 rounded-full bg-(--pk-lima)" />
      </span>
    </div>
  );
}

export interface ConversacionPekitoProps {
  borrador: string;
  onCambiarBorrador: (texto: string) => void;
  /** Prellena el compositor con una sugerencia y lo enfoca. */
  onSugerencia: (texto: string) => void;
  onEnviar: (texto: string) => void;
  onAccionAviso: (accion: AccionAviso) => void;
  onIrA: (ruta: string) => void;
  onRevisar: (llamadaId: string) => void;
  vozDisponible: boolean;
  onHablar: () => void;
  enfoquePendiente: boolean;
  onEnfocado: () => void;
}

/**
 * Conversación escrita con Pekito: estado vacío con
 * mascota y sugerencias, hilo con role="log", recibos de cada acción, avisos legibles y compositor.
 */
export function ConversacionPekito(props: ConversacionPekitoProps) {
  const { t } = useTranslation();
  const mensajes = useAsistenteStore("general", (estado) => estado.mensajes);
  const recibos = useAsistenteStore("general", (estado) => estado.recibos);
  const acciones = useAsistenteStore("general", (estado) => estado.accionesEnCurso);
  const anclas = useAsistenteStore("general", (estado) => estado.anclasRecibos);
  const cantidadAvisos = useAsistenteStore("general", (estado) => estado.avisos.length);
  const estadoSesion = useAsistenteStore("general", (estado) => estado.estadoSesion);
  const estadoMascota = useEstadoMascota({ saludaEnReposo: true });
  const hiloRef = useRef<HTMLDivElement>(null);

  const elementos = useMemo(() => lineaDeTiempo(mensajes, recibos, acciones, anclas), [mensajes, recibos, acciones, anclas]);
  const vacio = elementos.length === 0;
  const pensando = estadoSesion === "pensando" || estadoSesion === "conectando";
  const ocupado = pensando || acciones.length > 0;
  const ultimo = elementos.at(-1);

  // Mantiene a la vista lo más reciente.
  useEffect(() => {
    const hilo = hiloRef.current;
    if (!hilo) return;
    const reducido = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
    if (typeof hilo.scrollTo === "function") hilo.scrollTo({ top: hilo.scrollHeight, behavior: reducido ? "auto" : "smooth" });
    else hilo.scrollTop = hilo.scrollHeight;
  }, [elementos.length, ultimo, cantidadAvisos, pensando]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={hiloRef} tabIndex={0} role="region" aria-label={t("Historial de conversación")} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foco sm:px-5">
        {vacio ? (
          <div className="flex min-h-full flex-col items-center justify-center gap-4 py-6 text-center">
            <div className="pekito-orbe grid size-48 place-items-center rounded-full">
              <PekitoMascota ancho={150} estado={estadoMascota} className="max-w-[45vw]" />
            </div>
            <h3 className="pekito-marca text-[1.5rem] leading-[1.25] font-extrabold tracking-tight text-(--pk-texto) uppercase">{t("Hola, soy Peekito")}</h3>
            <p className="max-w-[20rem] text-base leading-snug text-(--pk-texto-suave)">
              {t("Te ayudo a encontrar trámites, preparar reportes y consultar tus folios. Tú siempre confirmas.")}
            </p>
            <ul aria-label={t("Sugerencias para empezar")} className="flex max-w-[23rem] flex-wrap justify-center gap-x-2.5 gap-y-2.5">
              {SUGERENCIAS_PEKITO.map((sugerencia) => (
                <li key={sugerencia.etiqueta}>
                  <button
                    type="button"
                    onClick={() => props.onSugerencia(t(sugerencia.texto))}
                    className="inline-flex min-h-11 items-center rounded-[22px] bg-(--pk-chip) px-[18px] text-sm text-(--pk-texto) hover:bg-(--pk-noche-2)"
                  >
                    {t(sugerencia.etiqueta)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div role="log" aria-live="polite" aria-relevant="additions text" aria-label={t("Conversación con Peekito")} className="space-y-4">
          {elementos.map((elemento) => {
            if (elemento.tipo === "mensaje") return <MensajePekito key={elemento.clave} mensaje={elemento.mensaje} onIrA={props.onIrA} />;
            if (elemento.tipo === "recibo") return <TarjetaRecibo key={elemento.clave} recibo={elemento.recibo} onRevisar={props.onRevisar} />;
            return <Pensando key={elemento.clave} texto={elemento.accion.estadoTexto} />;
          })}
          {pensando && acciones.length === 0 ? <Pensando texto={estadoSesion === "conectando" ? msg("Conectando…") : msg("Peekito está pensando…")} /> : null}
        </div>

        <ListaAvisosPekito onAccion={props.onAccionAviso} className="mt-4 space-y-2" />
      </div>

      <CompositorPekito
        valor={props.borrador}
        onCambiar={props.onCambiarBorrador}
        onEnviar={props.onEnviar}
        ocupado={ocupado}
        vozDisponible={props.vozDisponible}
        onHablar={props.onHablar}
        enfoquePendiente={props.enfoquePendiente}
        onEnfocado={props.onEnfocado}
      />
    </div>
  );
}
