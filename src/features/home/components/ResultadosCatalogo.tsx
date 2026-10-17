import { ChevronDown, SearchX } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ServiceCard } from "@/components/catalogo/ServiceCard";
import { Button, ButtonLink, EmptyState } from "@/design-system";
import type { ResultadoBusqueda } from "@/types";
import { SugerenciasBusqueda } from "./SugerenciasBusqueda";

const INICIALES = 8;

export interface ResultadosCatalogoProps {
  consulta: string;
  resultados: readonly ResultadoBusqueda[];
}

/**
 * Fichas del catálogo que coinciden con la consulta. Cada una abre su ficha interna
 * (/servicios/:id); nadie necesita saber qué dependencia la atiende.
 */
export function ResultadosCatalogo({ consulta, resultados }: ResultadosCatalogoProps) {
  const { t } = useTranslation();
  const [verTodos, setVerTodos] = useState(false);
  const visibles = verTodos ? resultados : resultados.slice(0, INICIALES);

  if (resultados.length === 0) {
    return (
      <EmptyState
        icono={SearchX}
        titulo={t("No encontré fichas del catálogo con esas palabras")}
        descripcion={
          <>
            <p>{t("Prueba con palabras más sencillas (p. ej. «bache», «licencia», «predial») o explora el catálogo por categorías.")}</p>
            <SugerenciasBusqueda titulo="Ejemplos" nivel={3} className="mt-5 text-left" />
          </>
        }
        accion={
          <ButtonLink to="/servicios" variante="secundario">
            {t("Explorar el catálogo")}
          </ButtonLink>
        }
      />
    );
  }

  return (
    <section aria-labelledby="titulo-resultados" data-guia="busqueda.resultados">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="titulo-resultados" className="text-lg font-semibold text-marino">
          {t("Fichas del catálogo")}
        </h2>
        <p className="text-sm text-tinta-suave" aria-live="polite">
          {resultados.length === 1 ? t("1 coincidencia para «{{consulta}}»", { consulta }) : t("{{total}} coincidencias para «{{consulta}}»", { total: resultados.length, consulta })}
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {visibles.map((resultado) => (
          <li key={resultado.servicio.id} className="min-w-0">
            <ServiceCard servicio={resultado.servicio} compacta className="h-full" />
          </li>
        ))}
      </ul>
      {resultados.length > visibles.length ? (
        <div className="mt-4">
          <Button variante="secundario" iconoInicio={ChevronDown} onClick={() => setVerTodos(true)} data-guia="busqueda.ver_mas">
            {t("Mostrar {{cantidad}} más", { cantidad: resultados.length - visibles.length })}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
