import { ArrowRightLeft, Sparkles } from "lucide-react";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import type { ExpertoAsistente } from "@shared/asistente/expertos";
import { AVATARES, TransicionExpertoContext } from "./expertos";

export function EstadoExperto({ experto }: { experto: ExpertoAsistente }) {
  const { t } = useTranslation();
  const cambiando = useContext(TransicionExpertoContext);
  const Icono = cambiando ? ArrowRightLeft : Sparkles;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-guia="asistente.experto"
      data-cambiando={cambiando}
      className="pekito-estado-experto relative mt-3 flex items-center gap-2.5 overflow-hidden rounded-xl bg-(--pekito-tema-suave) px-3 py-2.5 text-(--pekito-acento-tinta)"
    >
      <Icono aria-hidden="true" className="size-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm leading-snug font-semibold" data-guia="asistente.tema_actual">{t(AVATARES[experto].etiqueta)}</p>
        <p className="mt-0.5 text-xs leading-snug">{cambiando ? t("Cambiando al experto…") : t("El tema se adapta a tu pregunta")}</p>
      </div>
      {cambiando ? <span key={experto} aria-hidden="true" className="pekito-progreso-experto absolute inset-x-0 bottom-0 h-0.5 bg-current" /> : null}
    </div>
  );
}
