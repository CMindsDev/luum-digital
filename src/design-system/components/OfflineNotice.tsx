import { WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cx } from "../lib/cx";

export interface OfflineNoticeProps {
  descripcion?: string;
  className?: string;
}

/** Aviso de falta de conexión (real o simulada desde «Cuenta de demostración»). */
export function OfflineNotice({
  descripcion,
  className,
}: OfflineNoticeProps) {
  const { t } = useTranslation();
  // aviso #8A5200 sobre aviso-suave 5.70:1; tinta sobre aviso-suave ≥ 12:1
  return (
    <div role="status" className={cx("flex items-start gap-3 rounded-tarjeta border border-ambar bg-aviso-suave px-4 py-3", className)}>
      <WifiOff aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-aviso" />
      <p className="text-sm text-tinta">
        <strong className="font-semibold text-aviso">{t("Sin conexión.")} </strong>
        {descripcion ?? t("Estás sin conexión. Puedes seguir navegando; lo que necesite datos mostrará un aviso y tus datos de demostración se conservan.")}
      </p>
    </div>
  );
}
