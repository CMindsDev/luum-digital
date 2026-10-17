import { UserCog, Users } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  return (
    <Card as="section" aria-labelledby="titulo-cuenta-compartida" relleno="md" tono="crema" className="mb-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-boton bg-ambar-suave text-cafe">
          <Users aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="titulo-cuenta-compartida" className="text-lg font-semibold text-marino">
            {t("Cuenta de demostración compartida")}
          </h2>
          <p className="mt-1 max-w-prose text-[0.9375rem] text-tinta">
            <Trans i18nKey="Este expediente es ficticio y lo comparte toda la demostración. <strong>No es una cuenta ni una autenticación municipal</strong>: no hay contraseña, nunca te pedimos CURP, INE ni comprobantes reales y nada de lo que ves aquí tiene validez oficial." components={{ strong: <strong className="font-semibold" /> }} />
          </p>
          <SourceNote
            className="mt-3"
            fuente={EXPEDIENTE_OFICIAL}
            nota={t("Es otro sistema. Este prototipo no se conecta con él: no lee ni guarda nada ahí.")}
          />
          <ButtonLink to="/cuenta" variante="secundario" tamano="sm" iconoInicio={UserCog} className="mt-4" data-guia="expediente.cambiar_identidad">
            {t("Cambiar identidad ficticia")}
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}
