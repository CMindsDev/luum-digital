import { Mic, MicOff, PhoneOff } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cx } from "@/design-system";
import { msg } from "@/i18n";
import { useAsistenteStore } from "../runtime/store";
import type { AccionAviso } from "./AvisoPekito";
import { ListaAvisosPekito } from "./ListaAvisosPekito";
import { PekitoMascota } from "./PekitoMascota";
import { colaSubtitulo } from "./presencia";
import { useEstadoMascota } from "./useEstadoMascota";
import { useMediaQuery } from "./useMediaQuery";

export interface LlamadaPekitoProps {
  silenciado: boolean;
  onSilenciar: () => void;
  onColgar: () => void;
  onAccionAviso: (accion: AccionAviso) => void;
}

const ESTADOS: Record<string, string> = {
  conectando: msg("Conectando…"),
  escuchando: msg("Te escucho"),
  pensando: msg("Pensando…"),
  hablando: msg("Peekito está hablando"),
  listo: msg("Te escucho"),
};

/**
 * Llamada de voz (sólo con OpenAI Realtime): la mascota sigue el nivel de voz, subtítulos de lo que
 * se dice, silenciar y colgar. Con movimiento reducido la mascota no se mueve.
 */
export function LlamadaPekito({ silenciado, onSilenciar, onColgar, onAccionAviso }: LlamadaPekitoProps) {
  const { t } = useTranslation();
  const estadoSesion = useAsistenteStore("general", (estado) => estado.estadoSesion);
  const nivel = useAsistenteStore("general", (estado) => estado.nivelVoz);
  const mensajes = useAsistenteStore("general", (estado) => estado.mensajes);
  const reducido = useMediaQuery("(prefers-reduced-motion: reduce)");
  const estadoMascota = useEstadoMascota({ silenciado });

  const ultimo = mensajes.at(-1);
  const subtitulo = ultimo ? colaSubtitulo(ultimo.texto) : "";
  const quienHabla = ultimo?.rol === "persona" ? t("Tú") : "Peekito";
  const ultimoFinal = useMemo(() => [...mensajes].reverse().find((mensaje) => !mensaje.pendiente), [mensajes]);
  const estado = silenciado ? t("Micrófono silenciado") : t(ESTADOS[estadoSesion] ?? msg("En llamada"));

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center">
      <p role="status" className="pekito-rotulo text-[0.8125rem] text-(--pk-lima)">
        {estado}
      </p>

      <div className="grid flex-1 place-items-center py-6">
        <div
          style={reducido ? undefined : { transform: `scale(${1 + Math.min(1, nivel) * 0.16})` }}
          className={cx("pekito-orbe grid aspect-square w-[15.5rem] max-w-[70vw] place-items-center rounded-full p-6", reducido ? "" : "transition-transform duration-100 ease-out")}
        >
          <PekitoMascota ancho={190} estado={estadoMascota} nivel={nivel} className="max-w-[55vw]" />
        </div>
      </div>

      {/* Subtítulos: visuales; los lectores de pantalla reciben cada mensaje terminado, no los parciales. */}
      <p aria-hidden="true" className="min-h-[3.5rem] max-w-[22rem] text-lg leading-snug text-(--pk-texto)">
        {subtitulo ? (
          <>
            <span className="pekito-rotulo mr-1.5 text-[0.75rem] text-(--pk-texto-suave)">{quienHabla}</span>
            {subtitulo}
          </>
        ) : null}
      </p>
      <div role="log" aria-live="polite" className="sr-only">
        {ultimoFinal ? `${ultimoFinal.rol === "persona" ? t("Tú") : "Peekito"}: ${ultimoFinal.texto}` : ""}
      </div>

      <ListaAvisosPekito onAccion={onAccionAviso} className="mt-3 w-full max-w-[24rem] space-y-2 text-left" />

      <div className="mt-5 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={onSilenciar}
          aria-pressed={silenciado}
          data-guia="asistente.silenciar"
          className={cx(
            "grid size-14 place-items-center rounded-full",
            silenciado ? "bg-(--pk-lima) text-(--pk-noche)" : "bg-(--pk-chip) text-(--pk-texto) hover:bg-(--pk-noche-2)",
          )}
        >
          {silenciado ? <MicOff aria-hidden="true" className="size-6" /> : <Mic aria-hidden="true" className="size-6" />}
          <span className="sr-only">{silenciado ? t("Activar micrófono") : t("Silenciar micrófono")}</span>
        </button>
        <button
          type="button"
          onClick={onColgar}
          data-guia="asistente.colgar"
          className="grid size-14 place-items-center rounded-full bg-(--pk-peligro) text-(--pk-noche)"
        >
          <PhoneOff aria-hidden="true" className="size-6" />
          <span className="sr-only">{t("Colgar")}</span>
        </button>
      </div>
      <p className="mt-4 max-w-[22rem] text-xs leading-snug text-(--pk-texto-suave)">
        {t("Peekito puede equivocarse. Confirma los datos importantes con la fuente oficial. No compartas datos personales reales.")}
      </p>
    </div>
  );
}
