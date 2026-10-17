import { ClipboardList, FileQuestion } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
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

export function CargadorEscenario({ servicio, children }: CargadorEscenarioProps) {
  const { t } = useTranslation();
  const [parametros] = useSearchParams();
  const borradorId = parametros.get("borrador") ?? undefined;
  const escenario = useEscenarioDemo(escenarioIdPara(servicio.tipoDeRecorrido, servicio.recorridoDemoId));
  const borrador = useProcedure(borradorId);

  if (escenario.isPending || (borradorId && borrador.isPending)) {
    return <LoadingState etiqueta={t("Preparando el formulario de demostración…")} />;
  }
  if (escenario.isError) return <ErrorState error={escenario.error} nivel={2} onReintentar={() => void escenario.refetch()} />;
  if (borradorId && borrador.isError) return <ErrorState error={borrador.error} nivel={2} onReintentar={() => void borrador.refetch()} />;

  if (!escenario.data) {
    return (
      <EmptyState
        icono={FileQuestion}
        titulo={t("Este servicio no tiene un formulario de demostración")}
        descripcion={t("Revisa en la ficha los requisitos y los canales oficiales para hacer tu gestión.")}
        accion={<ButtonLink to={rutaFicha(servicio.id)}>{t("Volver a la ficha")}</ButtonLink>}
      />
    );
  }

  const gestion = borradorId ? (borrador.data ?? null) : null;
  if (borradorId && (!gestion || gestion.servicioId !== servicio.id)) {
    return (
      <EmptyState
        icono={ClipboardList}
        titulo={t("No encontramos ese borrador")}
        descripcion={t("Puede que se haya cancelado, que pertenezca a otra identidad de demostración o que se haya restablecido la demostración.")}
        accion={
          <>
            <ButtonLink to={`/servicios/${encodeURIComponent(servicio.id)}/iniciar`}>{t("Empezar de nuevo")}</ButtonLink>
            <ButtonLink to="/gestiones" variante="secundario">
              {t("Ir a Mis gestiones")}
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
        titulo={t("Esta gestión ya se envió")}
        descripcion={t("Tiene el folio de demostración {{folio}} y ya no se puede editar.", { folio: gestion.folio ?? t("asignado") })}
        accion={<ButtonLink to={`/gestiones/${encodeURIComponent(gestion.id)}`}>{t("Ver la gestión")}</ButtonLink>}
      />
    );
  }

  return <>{children(escenario.data, gestion)}</>;
}
