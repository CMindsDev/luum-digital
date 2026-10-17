import { ShieldOff, UserRound } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { useActiveIdentity } from "@/app/session/store";
import { ButtonLink, EmptyState } from "@/design-system";

/** Explica a la ciudadanía cómo cambiar a la identidad de operación (sin autenticación real). */
export function SinPermisoOperador() {
  const { t } = useTranslation();
  const actor = useActiveIdentity();
  return (
    <EmptyState
      icono={ShieldOff}
      titulo={t("Esta vista es para la operación de demostración")}
      descripcion={
        <>
          <p>
            <Trans
              i18nKey="Ahora usas la demostración como <strong>{{nombre}}</strong> (ciudadanía). Para validar reportes, registrar atención o revisar verificaciones, cambia a «Carmen Dzib» (operadora) o «Administración demo» en «Cuenta de demostración»."
              values={{ nombre: actor.nombre }}
              components={{ strong: <strong className="font-semibold text-tinta" /> }}
            />
          </p>
          <p className="mt-2">{t("No es una autenticación: sólo cambia con qué datos ficticios y acciones recorres el prototipo.")}</p>
        </>
      }
      accion={
        <ButtonLink to="/cuenta" iconoInicio={UserRound} data-guia="operador.cambiar_identidad">
          {t("Cambiar de identidad en «Cuenta»")}
        </ButtonLink>
      }
    />
  );
}
