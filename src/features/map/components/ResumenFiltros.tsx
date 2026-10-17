import { FilterX } from "lucide-react";
import { Button, Chip, ETIQUETA_ESTADO_MUNICIPAL } from "@/design-system";
import { NOMBRE_CATEGORIA_REPORTE } from "@/domain/reportes";
import type { CategoriaReporte, EstadoMunicipal } from "@/types";

export interface ResumenFiltrosProps {
  categorias: readonly CategoriaReporte[];
  estados: readonly EstadoMunicipal[];
  /** Incidencias que cumplen los filtros y total (undefined mientras cargan). */
  visibles: number | undefined;
  total: number | undefined;
  /** true si las incidencias no se pudieron cargar. */
  sinDatos?: boolean;
  onQuitarCategoria: (categoria: CategoriaReporte) => void;
  onQuitarEstado: (estado: EstadoMunicipal) => void;
  onLimpiar: () => void;
}

/** Conteo de resultados (anunciado) y filtros aplicados que se pueden quitar uno a uno. */
export function ResumenFiltros({ categorias, estados, visibles, total, sinDatos = false, onQuitarCategoria, onQuitarEstado, onLimpiar }: ResumenFiltrosProps) {
  const hayFiltros = categorias.length + estados.length > 0;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <p aria-live="polite" className="text-sm font-medium text-tinta" data-resultados={visibles ?? ""}>
        {visibles === undefined || total === undefined
          ? sinDatos
            ? "No se pudieron cargar las incidencias de demostración."
            : "Cargando incidencias de demostración…"
          : hayFiltros
            ? `${visibles} de ${total} incidencias de demostración con estos filtros`
            : `${total} incidencias de demostración`}
      </p>
      {hayFiltros ? (
        <ul aria-label="Filtros aplicados" className="flex flex-wrap gap-2">
          {categorias.map((categoria) => (
            <li key={categoria}>
              <Chip tono="marino" onQuitar={() => onQuitarCategoria(categoria)} etiquetaQuitar={`Quitar el filtro ${NOMBRE_CATEGORIA_REPORTE[categoria]}`}>
                {NOMBRE_CATEGORIA_REPORTE[categoria]}
              </Chip>
            </li>
          ))}
          {estados.map((estado) => (
            <li key={estado}>
              <Chip tono="marino" onQuitar={() => onQuitarEstado(estado)} etiquetaQuitar={`Quitar el filtro ${ETIQUETA_ESTADO_MUNICIPAL[estado]}`}>
                {ETIQUETA_ESTADO_MUNICIPAL[estado]}
              </Chip>
            </li>
          ))}
        </ul>
      ) : null}
      {hayFiltros ? (
        <Button variante="fantasma" tamano="sm" iconoInicio={FilterX} onClick={onLimpiar} data-guia="mapa.limpiar_filtros">
          Limpiar filtros
        </Button>
      ) : null}
    </div>
  );
}
