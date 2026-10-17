import { SearchX } from "lucide-react";
import { useLocation } from "react-router";
import { ButtonLink } from "@/design-system/components/ButtonLink";
import { EmptyState } from "@/design-system/components/EmptyState";
import { PageHeader } from "@/design-system/components/PageHeader";

/** 404 útil: explica qué pasó y ofrece caminos para seguir. */
export function PaginaNoEncontrada() {
  const { pathname } = useLocation();
  return (
    <>
      <PageHeader titulo="No encontramos esta página" regresar />
      <EmptyState
        icono={SearchX}
        titulo="La dirección no existe en el prototipo"
        descripcion={
          <p>
            Revisa la dirección <code className="rounded bg-superficie-2 px-1.5 py-0.5 text-sm break-all">{pathname}</code> o busca lo que
            necesitas.
          </p>
        }
        accion={
          <>
            <ButtonLink to="/">Ir al inicio</ButtonLink>
            <ButtonLink to="/servicios" variante="secundario">
              Ver trámites y servicios
            </ButtonLink>
            <ButtonLink to="/buscar" variante="fantasma">
              Buscar
            </ButtonLink>
          </>
        }
      />
    </>
  );
}
