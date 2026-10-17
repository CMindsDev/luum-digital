import { ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

/** Aviso permanente de la vista de operación: no es seguridad ni autorización de producción. */
export function AvisoDemostracion() {
  const { t } = useTranslation();

  return (
    <div role="note" data-guia="operador.aviso" className="flex items-start gap-3 rounded-tarjeta border border-ambar bg-aviso-suave px-4 py-3">
      <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-aviso" />
      <p className="text-[0.9375rem] text-tinta">
        <strong className="font-semibold">{t("Vista de demostración:")}</strong>{" "}
        {t("no es seguridad ni autorización de producción; en una integración real la validación y el saldo se controlan en el servidor.")}
      </p>
    </div>
  );
}
