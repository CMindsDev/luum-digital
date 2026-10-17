import type { TipoRecorrido } from "@/types";
import { AppointmentFlow } from "./AppointmentFlow";
import { DocumentLookupFlow } from "./DocumentLookupFlow";
import { FormFlow } from "./FormFlow";
import { InformationalFlow } from "./InformationalFlow";
import { PaymentFlow } from "./PaymentFlow";
import { ReportFlow } from "./ReportFlow";
import { TerritorialLookupFlow } from "./TerritorialLookupFlow";
import type { FlowProps } from "./tipos";
import { VerificationFlow } from "./VerificationFlow";

/** Elige el recorrido reutilizable según `tipoDeRecorrido` (un componente por tipo, sin duplicar). */
export function RecorridoServicio({ servicio }: FlowProps) {
  const tipo: TipoRecorrido = servicio.tipoDeRecorrido;
  switch (tipo) {
    case "informativo":
      return <InformationalFlow servicio={servicio} />;
    case "formulario":
      return <FormFlow servicio={servicio} />;
    case "cita":
      return <AppointmentFlow servicio={servicio} />;
    case "pago":
      return <PaymentFlow servicio={servicio} />;
    case "consulta_documental":
      return <DocumentLookupFlow servicio={servicio} />;
    case "consulta_territorial":
      return <TerritorialLookupFlow servicio={servicio} />;
    case "reporte":
      return <ReportFlow servicio={servicio} />;
    case "verificacion":
      return <VerificationFlow servicio={servicio} />;
  }
}
