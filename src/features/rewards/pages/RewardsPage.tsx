import { ListChecks, ShieldCheck } from "lucide-react";
import { ButtonLink, DemoTag, PageHeader } from "@/design-system";
import { BeneficiosDemo } from "../components/BeneficiosDemo";
import { HistorialMovimientos } from "../components/HistorialMovimientos";
import { MisCanjes } from "../components/MisCanjes";
import { ResumenPuntos } from "../components/ResumenPuntos";

/**
 * /participacion/recompensas — saldo disponible y pendiente, beneficios FICTICIOS con canje simulado
 * (ConfirmDialog, código DEMO-B sin validez, sin saldo negativo) e historial de movimientos.
 */
export default function RewardsPage() {
  return (
    <>
      <PageHeader
        titulo="Recompensas"
        antetitulo="Participación"
        regresar="/participacion"
        descripcion="Canjea tus puntos aprobados por beneficios de ejemplo. Todo es simulado: los beneficios y los códigos no tienen valor real."
      >
        <div className="flex flex-wrap gap-2">
          <DemoTag>Beneficios de ejemplo</DemoTag>
          <DemoTag>Reglas de demostración</DemoTag>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-8">
        <ResumenPuntos
          acciones={
            <ButtonLink to="/participacion/reglas" variante="secundario" tamano="sm" iconoInicio={ListChecks} data-guia="recompensas.reglas">
              Cómo se ganan los puntos
            </ButtonLink>
          }
        />

        <BeneficiosDemo />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <HistorialMovimientos />
          <div className="flex min-w-0 flex-col gap-5">
            <MisCanjes />
            <p className="flex items-start gap-2 rounded-tarjeta border border-borde bg-superficie-2 px-4 py-3 text-sm text-tinta">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-marino" />
              <span>
                En este prototipo el saldo se calcula en tu navegador con datos ficticios. En una integración real, los puntos, la validación y
                los canjes se controlarían en el servidor.
              </span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
