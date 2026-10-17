import { House, LayoutGrid, SearchX } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { ButtonLink, EmptyState, PageHeader } from "@/design-system";

/** 404 útil: explica, sugiere el buscador y regresa a secciones conocidas. */
export function NotFoundPage() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  return (
    <>
      <PageHeader titulo={t("No encontramos esta página")} regresar />
      <EmptyState
        icono={SearchX}
        titulo={t("La dirección no existe en este prototipo")}
        descripcion={
          <Trans
            i18nKey="Revisamos <0>{{pathname}}</0> y no corresponde a ninguna sección. Puede que el enlace sea antiguo o que la sección aún no exista."
            values={{ pathname }}
            components={[<code className="rounded bg-superficie-2 px-1.5 py-0.5 text-sm text-tinta" />]}
          />
        }
        accion={
          <>
            <ButtonLink to="/" iconoInicio={House}>
              {t("Ir al inicio")}
            </ButtonLink>
            <ButtonLink to="/servicios" variante="secundario" iconoInicio={LayoutGrid}>
              {t("Ver trámites y servicios")}
            </ButtonLink>
          </>
        }
      />
    </>
  );
}
