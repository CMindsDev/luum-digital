import { ShieldOff, UserRound } from "lucide-react";
import { useActiveIdentity } from "@/app/session/store";
import { ButtonLink, EmptyState } from "@/design-system";

/** Explica a la ciudadanía cómo cambiar a la identidad de operación (sin autenticación real). */
export function SinPermisoOperador() {
  const actor = useActiveIdentity();
  return (
    <EmptyState
      icono={ShieldOff}
      titulo="Esta vista es para la operación de demostración"
      descripcion={
        <>
          <p>
            Ahora usas la demostración como <strong className="font-semibold text-tinta">{actor.nombre}</strong> (ciudadanía). Para validar reportes,
            registrar atención o revisar verificaciones, cambia a «Carmen Dzib» (operadora) o «Administración demo» en «Cuenta de demostración».
          </p>
          <p className="mt-2">No es una autenticación: sólo cambia con qué datos ficticios y acciones recorres el prototipo.</p>
        </>
      }
      accion={
        <ButtonLink to="/cuenta" iconoInicio={UserRound} data-guia="operador.cambiar_identidad">
          Cambiar de identidad en «Cuenta»
        </ButtonLink>
      }
    />
  );
}
