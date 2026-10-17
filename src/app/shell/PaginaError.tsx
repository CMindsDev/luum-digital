import { isRouteErrorResponse, useRouteError } from "react-router";
import { ButtonLink } from "@/design-system/components/ButtonLink";
import { DemoRibbon } from "@/design-system/components/DemoRibbon";
import { ErrorState } from "@/design-system/components/ErrorState";
import { PageHeader } from "@/design-system/components/PageHeader";
import { PaginaNoEncontrada } from "./PaginaNoEncontrada";

/**
 * Límite de error de las rutas. Dentro del AppShell conserva la navegación; fuera de él
 * (si falla el propio AppShell) repone el rótulo de demostración.
 */
export function PaginaError({ fueraDelShell = false }: { fueraDelShell?: boolean }) {
  const error = useRouteError();
  if (!fueraDelShell && isRouteErrorResponse(error) && error.status === 404) return <PaginaNoEncontrada />;

  const contenido = (
    <>
      <PageHeader titulo="No pudimos mostrar esta pantalla" />
      <ErrorState
        error={error}
        onReintentar={() => window.location.reload()}
        accion={
          fueraDelShell ? (
            <a href="/" className="inline-flex min-h-11 items-center rounded-boton px-3.5 text-sm font-semibold text-marino underline">
              Ir al inicio
            </a>
          ) : (
            <ButtonLink to="/" variante="fantasma" tamano="sm">
              Ir al inicio
            </ButtonLink>
          )
        }
      />
    </>
  );

  if (!fueraDelShell) return contenido;
  return (
    <div className="min-h-dvh bg-fondo text-tinta">
      <DemoRibbon sinRouter />
      <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-3xl px-4 py-8 outline-none">
        {contenido}
      </main>
    </div>
  );
}
