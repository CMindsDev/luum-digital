import { SearchX } from "lucide-react";
import { useState } from "react";
import { ETIQUETA_AREA, ORDEN_AREAS } from "@/components/ayuda/etiquetas";
import { ProgramaBienestarCard } from "@/components/ayuda/ProgramaBienestarCard";
import { Button, EmptyState, ErrorState, FilterChip, LoadingState } from "@/design-system";
import { usePrograms, useServiceLocations } from "@/services/hooks";
import type { AreaBienestar, ProgramaBienestar } from "@/types";

const NOTAS: Readonly<Record<string, string>> = {
  "prog-ruta-salud-mental": "Dato de una nota de prensa del 12 de octubre de 2026: no implica vigencia ni publica calendario o forma de solicitarlo.",
  "prog-app-linea-mujer": "Un enlace a la tienda no es una integración: este prototipo no se conecta con la app.",
};

function contar(programas: readonly ProgramaBienestar[], area: AreaBienestar): number {
  return programas.filter((programa) => programa.area === area).length;
}

/**
 * Programas verificados por área (usePrograms). El filtro vive sólo en memoria (sin parámetros en la
 * URL). Estados: carga, error con reintento, vacío por filtro y éxito.
 */
export function ProgramasBienestar() {
  const [area, setArea] = useState<AreaBienestar | null>(null);
  const programas = usePrograms();
  const ubicaciones = useServiceLocations();

  if (programas.isPending) return <LoadingState variante="tarjetas" etiqueta="Cargando programas de bienestar…" />;
  if (programas.isError) {
    return <ErrorState error={programas.error} titulo="No se pudieron cargar los programas" onReintentar={() => void programas.refetch()} />;
  }

  const todos = programas.data;
  const visibles = area ? todos.filter((programa) => programa.area === area) : todos;

  return (
    <div className="space-y-5">
      <div role="group" aria-label="Filtrar programas por área" className="flex flex-wrap gap-2" data-guia="bienestar.filtro_area">
        <FilterChip seleccionado={area === null} onCambiar={() => setArea(null)} conteo={todos.length}>
          Todas
        </FilterChip>
        {ORDEN_AREAS.map((opcion) => (
          <FilterChip key={opcion} seleccionado={area === opcion} onCambiar={(activo) => setArea(activo ? opcion : null)} conteo={contar(todos, opcion)}>
            {ETIQUETA_AREA[opcion]}
          </FilterChip>
        ))}
      </div>

      <p className="text-sm text-tinta-suave" aria-live="polite">
        {visibles.length === 1 ? "1 programa" : `${visibles.length} programas`}
        {area ? ` de ${ETIQUETA_AREA[area].toLowerCase()}` : ""}. Cada uno indica si su información está verificada o pendiente de verificar.
      </p>

      {visibles.length === 0 ? (
        <EmptyState
          nivel={3}
          icono={SearchX}
          titulo="No hay programas en esta área"
          descripcion="Todavía no hay programas verificados de esta área en el prototipo."
          accion={
            <Button variante="secundario" onClick={() => setArea(null)}>
              Ver todas las áreas
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibles.map((programa) => (
            <li key={programa.id}>
              <ProgramaBienestarCard programa={programa} ubicaciones={ubicaciones.data ?? []} nota={NOTAS[programa.id]} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
