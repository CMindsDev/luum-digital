import { SearchX } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ETIQUETA_AREA, ORDEN_AREAS } from "@/components/ayuda/etiquetas";
import { ProgramaBienestarCard } from "@/components/ayuda/ProgramaBienestarCard";
import { Button, EmptyState, ErrorState, FilterChip, LoadingState } from "@/design-system";
import { msg } from "@/i18n";
import { usePrograms, useServiceLocations } from "@/services/hooks";
import type { AreaBienestar, ProgramaBienestar } from "@/types";

const NOTAS: Readonly<Record<string, string>> = {
  "prog-ruta-salud-mental": msg(
    "Dato de una nota de prensa del 12 de octubre de 2026: no implica vigencia ni publica calendario o forma de solicitarlo.",
  ),
  "prog-app-linea-mujer": msg("Un enlace a la tienda no es una integración: este prototipo no se conecta con la app."),
};

const ETIQUETAS_AREA: Readonly<Record<AreaBienestar, string>> = {
  salud: msg("Salud"),
  salud_mental: msg("Salud mental"),
  educacion: msg("Educación"),
  deporte: msg("Deporte"),
  mujeres: msg("Mujeres"),
};

function contar(programas: readonly ProgramaBienestar[], area: AreaBienestar): number {
  return programas.filter((programa) => programa.area === area).length;
}

/**
 * Programas verificados por área (usePrograms). El filtro vive sólo en memoria (sin parámetros en la
 * URL). Estados: carga, error con reintento, vacío por filtro y éxito.
 */
export function ProgramasBienestar() {
  const { t } = useTranslation();
  const [area, setArea] = useState<AreaBienestar | null>(null);
  const programas = usePrograms();
  const ubicaciones = useServiceLocations();

  if (programas.isPending) return <LoadingState variante="tarjetas" etiqueta={t("Cargando programas de bienestar…")} />;
  if (programas.isError) {
    return <ErrorState error={programas.error} titulo={t("No se pudieron cargar los programas")} onReintentar={() => void programas.refetch()} />;
  }

  const todos = programas.data;
  const visibles = area ? todos.filter((programa) => programa.area === area) : todos;

  return (
    <div className="space-y-5">
      <div role="group" aria-label={t("Filtrar programas por área")} className="flex flex-wrap gap-2" data-guia="bienestar.filtro_area">
        <FilterChip seleccionado={area === null} onCambiar={() => setArea(null)} conteo={todos.length}>
          {t("Todas")}
        </FilterChip>
        {ORDEN_AREAS.map((opcion) => (
          <FilterChip key={opcion} seleccionado={area === opcion} onCambiar={(activo) => setArea(activo ? opcion : null)} conteo={contar(todos, opcion)}>
            {t(ETIQUETAS_AREA[opcion] ?? ETIQUETA_AREA[opcion])}
          </FilterChip>
        ))}
      </div>

      <p className="text-sm text-tinta-suave" aria-live="polite">
        {area
          ? t(visibles.length === 1 ? "1 programa de {{area}}" : "{{cantidad}} programas de {{area}}", {
              cantidad: visibles.length,
              area: t(ETIQUETAS_AREA[area] ?? ETIQUETA_AREA[area]).toLocaleLowerCase(),
            })
          : t(visibles.length === 1 ? "1 programa" : "{{cantidad}} programas", { cantidad: visibles.length })}
        {t(". Cada uno indica si su información está verificada o pendiente de verificar.")}
      </p>

      {visibles.length === 0 ? (
        <EmptyState
          nivel={3}
          icono={SearchX}
          titulo={t("No hay programas en esta área")}
          descripcion={t("Todavía no hay programas verificados de esta área en el prototipo.")}
          accion={
            <Button variante="secundario" onClick={() => setArea(null)}>
              {t("Ver todas las áreas")}
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibles.map((programa) => {
            const nota = NOTAS[programa.id];
            return (
              <li key={programa.id}>
                <ProgramaBienestarCard programa={programa} ubicaciones={ubicaciones.data ?? []} nota={nota ? t(nota) : undefined} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
