import { SearchX } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { ButtonLink } from "@/design-system/components/ButtonLink";
import { EmptyState } from "@/design-system/components/EmptyState";
import { PageHeader } from "@/design-system/components/PageHeader";

/** 404 útil: explica qué pasó y ofrece caminos para seguir. */
export function PaginaNoEncontrada() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  return (
    <>
      <PageHeader titulo={t("No encontramos esta página")} regresar />
      <EmptyState
        icono={SearchX}
        titulo={t("La dirección no existe en el prototipo")}
        descripcion={
          <Trans
            i18nKey="Revisa la dirección <0>{{pathname}}</0> o busca lo que necesitas."
            values={{ pathname }}
            components={[<code className="rounded bg-superficie-2 px-1.5 py-0.5 text-sm break-all" />]}
          />
        }
        accion={
          <>
            <ButtonLink to="/">{t("Ir al inicio")}</ButtonLink>
            <ButtonLink to="/servicios" variante="secundario">
              {t("Ver trámites y servicios")}
            </ButtonLink>
            <ButtonLink to="/buscar" variante="fantasma">
              {t("Buscar")}
            </ButtonLink>
          </>
        }
      />
    </>
  );
}
