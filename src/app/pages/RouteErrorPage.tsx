import { House } from "lucide-react";
import { useTranslation } from "react-i18next";
import { isRouteErrorResponse, useRouteError } from "react-router";
import { ButtonLink, DemoRibbon, ErrorState, PageHeader } from "@/design-system";
import { NotFoundPage } from "./NotFoundPage";

/**
 * errorElement del router. Dentro del AppShell muestra el error en el área de contenido; si falla
 * el propio AppShell (`fueraDelShell`), conserva el rótulo de demostración y ofrece recargar.
 */
export function RouteErrorPage({ fueraDelShell = false }: { fueraDelShell?: boolean }) {
  const { t } = useTranslation();
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404 && !fueraDelShell) return <NotFoundPage />;

  const contenido = (
    <>
      <PageHeader titulo={t("Algo salió mal en esta pantalla")} />
      <ErrorState
        error={error}
        onReintentar={() => window.location.reload()}
        accion={
          fueraDelShell ? (
            <a href="/" className="inline-flex min-h-11 items-center gap-2 rounded-boton px-3 font-semibold text-enlace underline">
              {t("Ir al inicio")}
            </a>
          ) : (
            <ButtonLink to="/" variante="fantasma" tamano="sm" iconoInicio={House}>
              {t("Ir al inicio")}
            </ButtonLink>
          )
        }
      />
    </>
  );

  if (!fueraDelShell) return contenido;
  return (
    <div className="min-h-dvh bg-fondo">
      <DemoRibbon sinRouter />
      <main id="contenido" className="mx-auto max-w-3xl px-4 py-8">
        {contenido}
      </main>
    </div>
  );
}
