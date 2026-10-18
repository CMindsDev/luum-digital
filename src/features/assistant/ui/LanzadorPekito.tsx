import { Keyboard, Mic } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { cx } from "@/design-system";
import type { ServidorPekito } from "../useControladorPekito";
import { ListaAvisosPekito } from "./ListaAvisosPekito";
import type { AccionAviso } from "./AvisoPekito";
import { PekitoMascota } from "./PekitoMascota";
import { useEstadoMascota } from "./useEstadoMascota";

export interface LanzadorPekitoProps {
  servidor: ServidorPekito;
  onHablar: () => void;
  onEscribir: () => void;
  onVerBienvenida: () => void;
  onAccionAviso: (accion: AccionAviso) => void;
  /** Conectando el micrófono y la llamada. */
  conectando: boolean;
}

interface TarjetaProps {
  icono: typeof Mic;
  titulo: string;
  detalle: string;
  onClick: () => void;
  deshabilitada?: boolean;
  ocupada?: boolean;
  describedBy?: string;
  guia: string;
}

function TarjetaModo({ icono: Icono, titulo, detalle, onClick, deshabilitada = false, ocupada = false, describedBy, guia }: TarjetaProps) {
  return (
    <button
      type="button"
      onClick={deshabilitada || ocupada ? undefined : onClick}
      aria-disabled={deshabilitada || undefined}
      aria-busy={ocupada || undefined}
      aria-describedby={describedBy}
      data-guia={guia}
      className={cx(
        "flex min-h-[10.25rem] flex-1 flex-col items-center justify-center gap-1.5 rounded-[16px] px-3 py-4 text-center transition-transform",
        "bg-(--pk-superficie) shadow-[inset_0_0_0_1px_var(--pk-borde)] motion-safe:active:scale-[0.97]",
        deshabilitada ? "cursor-not-allowed opacity-70" : "hover:shadow-[inset_0_0_0_2px_var(--pk-lima)]",
      )}
    >
      <span className="mb-2 grid size-[52px] place-items-center rounded-full bg-(--pk-chip) text-(--pk-lima)">
        <Icono aria-hidden="true" className="size-6" />
      </span>
      <span className="text-base font-bold text-(--pk-texto)">{titulo}</span>
      <span className="text-xs leading-tight text-(--pk-texto-suave)">{detalle}</span>
    </button>
  );
}

/**
 * Lanzador «Por texto o por voz» (Vital Oceans 3539:642 con la piel del Laboratorio): título,
 * mascota con halos y tarjetas Hablar / Escribir. «Hablar» sólo funciona cuando la voz está
 * disponible; si no, lo explica con un mensaje breve y humano.
 */
export function LanzadorPekito({ servidor, onHablar, onEscribir, onVerBienvenida, onAccionAviso, conectando }: LanzadorPekitoProps) {
  const { t } = useTranslation();
  const idNotaVoz = useId();
  const estadoMascota = useEstadoMascota({ saludaEnReposo: true });
  const hayReal = servidor.realtime !== null;
  const puedeHablar = hayReal;
  const notaVoz = !servidor.consultado
    ? t("Revisando si la voz está disponible…")
    : !hayReal
      ? t(servidor.motivoSinVoz)
      : t("Peekito te escucha sólo mientras dure la llamada.");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-6 pt-2 pb-6">
      <h3 className="text-[2.5rem] leading-[1.02] font-bold tracking-[-0.024em] text-(--pk-texto)">
        {t("Por texto")}{" "}
        <br />
        <span className="pekito-serif text-[2.9rem] font-normal">{t("o por voz.")}</span>
      </h3>
      <p className="mt-3 text-base leading-snug text-(--pk-texto-suave)">{t("Habla de forma natural o escribe cuando prefieras.")}</p>

      <div aria-hidden="true" className="relative mx-auto my-6 grid size-[15.5rem] shrink-0 place-items-center">
        <span className="pekito-halo absolute inset-0 rounded-full bg-(--pekito-halo)" />
        <span className="pekito-halo pekito-halo-2 absolute inset-[1.75rem] rounded-full bg-(--pekito-halo-2)" />
        <span className="pekito-halo pekito-halo-3 absolute inset-[3.5rem] rounded-full bg-(--pekito-halo-3)" />
        <PekitoMascota ancho={104} estado={estadoMascota} className="relative" />
      </div>

      <ListaAvisosPekito onAccion={onAccionAviso} className="mb-4 space-y-2" />

      <div className="flex gap-2.5">
        <TarjetaModo
          icono={Mic}
          titulo={t("Hablar")}
          detalle={t("Como conversas normalmente")}
          onClick={onHablar}
          deshabilitada={!puedeHablar}
          ocupada={conectando}
          describedBy={idNotaVoz}
          guia="asistente.hablar"
        />
        <TarjetaModo icono={Keyboard} titulo={t("Escribir")} detalle={t("Cuando lo prefieras")} onClick={onEscribir} guia="asistente.escribir" />
      </div>
      <p id={idNotaVoz} className="mt-3 text-xs leading-snug text-(--pk-texto-suave)">
        {notaVoz}
      </p>

      <p className="mt-5 text-xs leading-snug text-(--pk-texto-suave)">
        {t("Peekito te ayuda a orientarte en la app. Lo que conversas en Bienestar va por separado.")}
      </p>
      <button
        type="button"
        onClick={onVerBienvenida}
        className="mt-2 inline-flex min-h-11 items-center self-start text-sm text-(--pk-texto-suave) underline underline-offset-2 hover:text-(--pk-texto)"
      >
        {t("Ver la bienvenida otra vez")}
      </button>
    </div>
  );
}
