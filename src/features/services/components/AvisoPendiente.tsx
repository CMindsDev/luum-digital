import { Hourglass } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cx } from "@/design-system";

/** Aviso estándar cuando un dato de la ficha no se ha contrastado con su fuente. `que` va en minúsculas: «los pasos». */
export function AvisoPendiente({ que, className }: { que: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <div className={cx("flex items-start gap-3 rounded-boton border border-ambar bg-aviso-suave px-4 py-3", className)}>
      <Hourglass aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-aviso" />
      <p className="text-[0.9375rem] text-tinta">
        <strong className="font-semibold text-aviso">{t("Pendiente de verificar.")}</strong>{" "}
        {t("No hemos contrastado {{que}} con la ficha oficial. Revísalo en la fuente antes de acudir o de hacer tu trámite real.", { que })}
      </p>
    </div>
  );
}
