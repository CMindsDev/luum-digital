import { FilterX, SlidersHorizontal } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ESTADOS_INFORMACION,
  ETIQUETA_FILTRO_INFORMACION,
  ETIQUETA_TIPO_RECORRIDO,
  TIPOS_RECORRIDO,
} from "@/components/catalogo";
import { Button, Field, Select } from "@/design-system";
import type { Categoria, FiltroCatalogo } from "@/types";

export interface FiltrosCatalogoProps {
  filtro: FiltroCatalogo;
  /** Si se da, muestra el selector de categoría. */
  categorias?: readonly Categoria[];
  onCambiar: (cambios: Partial<Record<keyof FiltroCatalogo, string | undefined>>) => void;
  onLimpiar?: () => void;
}

/** Filtros del catálogo: categoría, estado de la información y tipo de recorrido (selects nativos). */
export function FiltrosCatalogo({ filtro, categorias, onCambiar, onLimpiar }: FiltrosCatalogoProps) {
  const { t } = useTranslation();
  const activos = [filtro.categoria, filtro.estadoDeInformacion, filtro.tipoDeRecorrido].filter(Boolean).length;
  const [abiertos, setAbiertos] = useState(activos > 0);
  const idFiltros = `filtros-${useId().replace(/:/g, "")}`;
  return (
    <div className="min-w-0">
      <Button
        variante="secundario"
        tamano="sm"
        iconoInicio={SlidersHorizontal}
        aria-expanded={abiertos}
        aria-controls={idFiltros}
        onClick={() => setAbiertos((actual) => !actual)}
        className="sm:hidden"
      >
        {abiertos ? t("Ocultar filtros") : activos > 0 ? t("Mostrar filtros ({{total}})", { total: activos }) : t("Mostrar filtros")}
      </Button>
      <fieldset id={idFiltros} className={abiertos ? "mt-3 min-w-0 sm:mt-0" : "hidden min-w-0 sm:block"}>
        <legend className="sr-only">{t("Filtrar servicios")}</legend>
        <div className={categorias ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-3 sm:grid-cols-2"}>
          {categorias ? (
            <Field etiqueta={t("Categoría")}>
              <Select
                value={filtro.categoria ?? ""}
                onChange={(evento) => onCambiar({ categoria: evento.target.value || undefined })}
                marcador={t("Todas las categorías")}
                opciones={categorias.map((categoria) => ({ valor: categoria.id, etiqueta: categoria.nombre }))}
                data-guia="servicios.filtro_categoria"
              />
            </Field>
          ) : null}
          <Field etiqueta={t("Estado de la información")}>
            <Select
              value={filtro.estadoDeInformacion ?? ""}
              onChange={(evento) => onCambiar({ estadoDeInformacion: evento.target.value || undefined })}
              marcador={t("Cualquier estado")}
              opciones={ESTADOS_INFORMACION.map((estado) => ({ valor: estado, etiqueta: t(ETIQUETA_FILTRO_INFORMACION[estado]) }))}
              data-guia="servicios.filtro_informacion"
            />
          </Field>
          <Field etiqueta={t("Tipo de recorrido")}>
            <Select
              value={filtro.tipoDeRecorrido ?? ""}
              onChange={(evento) => onCambiar({ tipoDeRecorrido: evento.target.value || undefined })}
              marcador={t("Cualquier recorrido")}
              opciones={TIPOS_RECORRIDO.map((tipo) => ({ valor: tipo, etiqueta: t(ETIQUETA_TIPO_RECORRIDO[tipo]) }))}
              data-guia="servicios.filtro_recorrido"
            />
          </Field>
        </div>
        {activos > 0 && onLimpiar ? (
          <Button variante="fantasma" tamano="sm" iconoInicio={FilterX} onClick={onLimpiar} className="mt-2" data-guia="servicios.limpiar_filtros">
            {t("Quitar filtros ({{total}})", { total: activos })}
          </Button>
        ) : null}
      </fieldset>
    </div>
  );
}
