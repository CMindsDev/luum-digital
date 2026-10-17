import { useTranslation } from "react-i18next";
import { CargadorEscenario } from "./escenario/CargadorEscenario";
import { SolicitudSimulada } from "./escenario/SolicitudSimulada";
import type { FlowProps } from "./tipos";

export function FormFlow({ servicio }: FlowProps) {
  const { t } = useTranslation();
  return (
    <CargadorEscenario servicio={servicio}>
      {(escenario, borrador) => (
        <SolicitudSimulada
          servicio={servicio}
          escenario={escenario}
          borrador={borrador}
          pasos={[t("Tus datos"), t("Revisión"), t("Folio DEMO")]}
          textoEnviar={t("Enviar solicitud simulada")}
          avisoRevision={
            <>
              {t("Al enviar recibirás un ")}
              <strong className="font-semibold">{t("folio DEMO-G")}</strong>
              {t(" sin validez oficial. La solicitud no llega a ningún sistema municipal; podrás darle seguimiento en «Mis gestiones».")}
            </>
          }
        />
      )}
    </CargadorEscenario>
  );
}
