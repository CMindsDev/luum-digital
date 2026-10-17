import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRestablecerDemo } from "@/app/hooks/useRestablecerDemo";
import { Button, Card, ConfirmDialog } from "@/design-system";

/** Borra todo lo creado en este navegador y vuelve a los datos ficticios iniciales. */
export function ResetSection() {
  const { t } = useTranslation();
  const [confirmar, setConfirmar] = useState(false);
  const { restablecer, restableciendo } = useRestablecerDemo();
  return (
    <Card as="section" aria-labelledby="titulo-restablecer" relleno="lg">
      <h2 id="titulo-restablecer" className="text-xl font-semibold text-marino">
        {t("Restablecer demostración")}
      </h2>
      <p className="mt-1 max-w-prose text-[0.9375rem] text-tinta-suave">
        {t("Borra los reportes, gestiones, verificaciones, puntos, canjes y preferencias que creaste en este navegador. Útil antes de mostrar el prototipo a otra persona.")}
      </p>
      <Button variante="peligro" iconoInicio={RotateCcw} className="mt-5" onClick={() => setConfirmar(true)} data-guia="cuenta.restablecer">
        {t("Restablecer demostración")}
      </Button>
      <ConfirmDialog
        abierto={confirmar}
        onCerrar={() => setConfirmar(false)}
        onConfirmar={restablecer}
        cargando={restableciendo}
        tono="peligro"
        titulo={t("¿Restablecer la demostración?")}
        descripcion={t("Se borrará todo lo que creaste en este navegador y volverás al inicio con los datos ficticios originales. No se puede deshacer.")}
        textoConfirmar={t("Sí, restablecer")}
      />
    </Card>
  );
}
