import { CargadorEscenario } from "./escenario/CargadorEscenario";
import { SolicitudSimulada } from "./escenario/SolicitudSimulada";
import type { FlowProps } from "./tipos";

/**
 * Recorrido «formulario»: escenario ficticio (src/data/recorridos-demo.ts) con React Hook Form + Zod,
 * borrador, «Usar datos de mi expediente» con confirmación, revisión y envío con folio DEMO-G.
 */
export function FormFlow({ servicio }: FlowProps) {
  return (
    <CargadorEscenario servicio={servicio}>
      {(escenario, borrador) => (
        <SolicitudSimulada
          servicio={servicio}
          escenario={escenario}
          borrador={borrador}
          pasos={["Tus datos", "Revisión", "Folio DEMO"]}
          textoEnviar="Enviar solicitud simulada"
          avisoRevision={
            <>
              Al enviar recibirás un <strong className="font-semibold">folio DEMO-G</strong> sin validez oficial. La solicitud no llega a
              ningún sistema municipal; podrás darle seguimiento en «Mis gestiones».
            </>
          }
        />
      )}
    </CargadorEscenario>
  );
}
