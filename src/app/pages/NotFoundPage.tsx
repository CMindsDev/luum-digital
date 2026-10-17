import { House, LayoutGrid, SearchX } from "lucide-react";
import { useLocation } from "react-router";
import { ButtonLink, EmptyState, PageHeader } from "@/design-system";

/** 404 útil: explica, sugiere el buscador y regresa a secciones conocidas. */
export function NotFoundPage() {
  const { pathname } = useLocation();
  return (
    <>
      <PageHeader titulo="No encontramos esta página" regresar />
      <EmptyState
        icono={SearchX}
        titulo="La dirección no existe en este prototipo"
        descripcion={
          <p>
            Revisamos <code className="rounded bg-superficie-2 px-1.5 py-0.5 text-sm text-tinta">{pathname}</code> y no corresponde a
            ninguna sección. Puede que el enlace sea antiguo o que la sección aún no exista.
          </p>
        }
        accion={
          <>
            <ButtonLink to="/" iconoInicio={House}>
              Ir al inicio
            </ButtonLink>
            <ButtonLink to="/servicios" variante="secundario" iconoInicio={LayoutGrid}>
              Ver trámites y servicios
            </ButtonLink>
          </>
        }
      />
    </>
  );
}
