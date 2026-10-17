import { AlertOctagon, AlertTriangle, Info, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { msg } from "@/i18n";
import type { AvisoAsistente } from "@/services/contracts";
import type { AvisoVisible } from "../runtime/store";

export type AccionAviso = NonNullable<AvisoAsistente["accion"]>;

const ICONOS = { critico: AlertOctagon, precaucion: AlertTriangle, info: Info, neutral: Info } as const;

const ETIQUETAS_ACCION: Record<AccionAviso, string> = {
  reintentar: msg("Reintentar"),
  escribir: msg("Escribir"),
  reconectar: msg("Reconectar"),
  activar_audio: msg("Activar audio"),
};

export interface AvisoPekitoProps {
  aviso: AvisoVisible;
  onAccion: (accion: AccionAviso) => void;
  onDescartar: (id: string) => void;
}

/** Aviso legible del asistente (taxonomía de Alex/Marea): título amable, detalle y, si sirve, una acción. */
export function AvisoPekito({ aviso, onAccion, onDescartar }: AvisoPekitoProps) {
  const { t } = useTranslation();
  const Icono = ICONOS[aviso.tono];
  const critico = aviso.tono === "critico";
  const accion = aviso.accion;
  return (
    <div
      role={critico ? "alert" : "status"}
      className="flex items-start gap-3 rounded-[18px] bg-(--pk-superficie) px-4 py-3 text-sm shadow-[inset_0_0_0_1px_var(--pk-borde)]"
    >
      <Icono aria-hidden="true" className={critico ? "mt-0.5 size-5 shrink-0 text-(--pk-peligro)" : "mt-0.5 size-5 shrink-0 text-(--pk-lima)"} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-(--pk-texto)">{t(aviso.titulo)}</p>
        {aviso.detalle ? <p className="mt-0.5 text-(--pk-texto-suave)">{t(aviso.detalle)}</p> : null}
        {accion ? (
          <button
            type="button"
            onClick={() => onAccion(accion)}
            className="mt-2 inline-flex min-h-11 items-center rounded-pildora bg-(--pk-lima) px-4 text-sm font-semibold text-(--pk-noche)"
          >
            {t(ETIQUETAS_ACCION[accion])}
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDescartar(aviso.id)}
        aria-label={t("Descartar aviso: {{titulo}}", { titulo: t(aviso.titulo) })}
        className="-m-2 grid size-11 shrink-0 place-items-center rounded-full text-(--pk-texto-suave) hover:text-(--pk-texto)"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
