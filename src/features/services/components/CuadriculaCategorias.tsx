import { useCategories } from "@/services/hooks";
import { ErrorState, LoadingState, Tile, resolverIcono } from "@/design-system";

/**
 * Categorías del catálogo como mosaicos de color del Laboratorio (ícono + texto, nunca sólo color).
 * Llevan a la portada interna de cada categoría.
 */
export function CuadriculaCategorias() {
  const { data, isPending, isError, error, refetch } = useCategories();
  if (isPending) return <LoadingState etiqueta="Cargando categorías…" variante="tarjetas" />;
  if (isError) return <ErrorState error={error} nivel={3} onReintentar={() => void refetch()} />;
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {data.map((categoria) => (
        <li key={categoria.id} className="min-w-0">
          <Tile
            etiqueta={categoria.nombre}
            icono={resolverIcono(categoria.icono)}
            tono={categoria.tono}
            to={`/servicios/categoria/${categoria.id}`}
            guia={`servicios.categoria_${categoria.id}`}
            className="min-h-32"
          />
        </li>
      ))}
    </ul>
  );
}
