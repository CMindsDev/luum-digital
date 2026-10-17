import { ClipboardList, FileQuestion } from "lucide-react";
import type { ReactNode } from "react";
import { useSearchParams } from "react-router";
import { escenarioIdPara, useEscenarioDemo, type EscenarioDemo } from "@/components/catalogo/datos-demo";
import { rutaFicha } from "@/components/catalogo";
import { useProcedure } from "@/services/hooks";
import { ButtonLink, EmptyState, ErrorState, LoadingState } from "@/design-system";
import type { Gestion, Servicio } from "@/types";

export interface CargadorEscenarioProps {
  servicio: Servicio;
  children: (escenario: EscenarioDemo, borrador: Gestion | null) => ReactNode;
}

/**
 * Carga el escenario ficticio del servicio y, si la URL trae ?borrador=<id>, el borrador de la
 * persona. Maneja carga, error, escenario inexistente y borradores ya enviados.
 */
export function CargadorEscenario({ servicio, children }: CargadorEscenarioProps) {
  const [parametros] = useSearchParams();
  const borradorId = parametros.get("borrador") ?? undefined;
  const escenario = useEscenarioDemo(escenarioIdPara(servicio.tipoDeRecorrido, servicio.recorridoDemoId));
  const borrador = useProcedure(borradorId);

  if (escenario.isPending || (borradorId && borrador.isPending)) {
    return <LoadingState etiqueta="Preparando el formulario de demostración…" />;
  }
  if (escenario.isError) return <ErrorState error={escenario.error} nivel={2} onReintentar={() => void escenario.refetch()} />;
  if (borradorId && borrador.isError) return <ErrorState error={borrador.error} nivel={2} onReintentar={() => void borrador.refetch()} />;

  if (!escenario.data) {
    return (
      <EmptyState
        icono={FileQuestion}
        titulo="Este servicio no tiene un formulario de demostración"
        descripcion="Revisa en la ficha los requisitos y los canales oficiales para hacer tu gestión."
        accion={<ButtonLink to={rutaFicha(servicio.id)}>Volver a la ficha</ButtonLink>}
      />
    );
  }

  const gestion = borradorId ? (borrador.data ?? null) : null;
  if (borradorId && (!gestion || gestion.servicioId !== servicio.id)) {
    return (
      <EmptyState
        icono={ClipboardList}
        titulo="No encontramos ese borrador"
        descripcion="Puede que se haya cancelado, que pertenezca a otra identidad de demostración o que se haya restablecido la demostración."
        accion={
          <>
            <ButtonLink to={`/servicios/${encodeURIComponent(servicio.id)}/iniciar`}>Empezar de nuevo</ButtonLink>
            <ButtonLink to="/gestiones" variante="secundario">
              Ir a Mis gestiones
            </ButtonLink>
          </>
        }
      />
    );
  }
  if (gestion && gestion.estado !== "borrador") {
    return (
      <EmptyState
        icono={ClipboardList}
        titulo="Esta gestión ya se envió"
        descripcion={`Tiene el folio de demostración ${gestion.folio ?? "asignado"} y ya no se puede editar.`}
        accion={<ButtonLink to={`/gestiones/${encodeURIComponent(gestion.id)}`}>Ver la gestión</ButtonLink>}
      />
    );
  }

  return <>{children(escenario.data, gestion)}</>;
}
