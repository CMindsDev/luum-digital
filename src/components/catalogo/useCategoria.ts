import { useCategories } from "@/services/hooks";
import type { Categoria, CategoriaId } from "@/types";

/** Categoría del catálogo por id (null mientras carga, si falla o si no existe). */
export function useCategoria(id: CategoriaId | string | undefined): Categoria | null {
  const { data } = useCategories();
  if (!id || !data) return null;
  return data.find((categoria) => categoria.id === id) ?? null;
}
