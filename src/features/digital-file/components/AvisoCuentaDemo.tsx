import { UserCog, Users } from "lucide-react";
import { ButtonLink, Card, SourceNote } from "@/design-system";
import type { FuenteConsultada } from "@/types";

/** Expediente Digital oficial (sólo referencia: un enlace no es una integración). */
const EXPEDIENTE_OFICIAL: FuenteConsultada = {
  nombre: "Expediente Digital del Ayuntamiento de Mérida",
  url: "https://expedientedigital.merida.gob.mx/",
  fechaConsulta: "2026-10-17",
};

/**
 * Explica que el expediente es de una cuenta de demostración compartida (no hay autenticación
 * municipal) y que nunca se piden CURP, INE ni comprobantes reales.
 */
export function AvisoCuentaDemo() {
  return (
    <Card as="section" aria-labelledby="titulo-cuenta-compartida" relleno="md" tono="crema" className="mb-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-boton bg-ambar-suave text-cafe">
          <Users aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="titulo-cuenta-compartida" className="text-lg font-semibold text-marino">
            Cuenta de demostración compartida
          </h2>
          <p className="mt-1 max-w-prose text-[0.9375rem] text-tinta">
            Este expediente es ficticio y lo comparte toda la demostración. <strong className="font-semibold">No es una cuenta ni una
            autenticación municipal</strong>: no hay contraseña, nunca te pedimos CURP, INE ni comprobantes reales y nada de lo que ves
            aquí tiene validez oficial.
          </p>
          <SourceNote
            className="mt-3"
            fuente={EXPEDIENTE_OFICIAL}
            nota="Es otro sistema. Este prototipo no se conecta con él: no lee ni guarda nada ahí."
          />
        </div>
        <ButtonLink to="/cuenta" variante="secundario" tamano="sm" iconoInicio={UserCog} className="shrink-0" data-guia="expediente.cambiar_identidad">
          Cambiar identidad ficticia
        </ButtonLink>
      </div>
    </Card>
  );
}
