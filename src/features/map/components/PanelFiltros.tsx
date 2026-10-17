import { ICONO_CATEGORIA_REPORTE } from "@/components/reportes/categorias-reporte";
import { useTranslation } from "react-i18next";
import { cx, ETIQUETA_ESTADO_MUNICIPAL, FilterChip, ICONO_ESTADO_MUNICIPAL } from "@/design-system";
import { CATEGORIAS_REPORTE, NOMBRE_CATEGORIA_REPORTE } from "@/domain/reportes";
import type { CategoriaReporte, EstadoMunicipal } from "@/types";
import { alternar, ESTADOS_MUNICIPALES } from "../estado-url";
import { ETIQUETA_ESTADO_MUNICIPAL_MAPA_UI, NOMBRE_CATEGORIA_REPORTE_MAPA_UI } from "../i18n";

export interface PanelFiltrosProps {
  categorias: readonly CategoriaReporte[];
  estados: readonly EstadoMunicipal[];
  conteoCategorias: Record<CategoriaReporte, number>;
  conteoEstados: Record<EstadoMunicipal, number>;
  onCambiar: (cambios: { categorias?: CategoriaReporte[]; estados?: EstadoMunicipal[] }) => void;
  className?: string;
}

/** Filtros de incidencias por tipo de reporte y estado municipal (se aplican al instante y viven en la URL). */
export function PanelFiltros({ categorias, estados, conteoCategorias, conteoEstados, onCambiar, className }: PanelFiltrosProps) {
  const { t } = useTranslation();
  return (
    <div className={cx("space-y-5", className)}>
      <fieldset data-guia="mapa.filtro_tipo">
        <legend className="mb-2 font-mono text-xs font-medium tracking-[0.08em] text-tinta-suave uppercase">{t("Tipo de reporte")}</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS_REPORTE.map((categoria) => (
            <FilterChip
              key={categoria}
              seleccionado={categorias.includes(categoria)}
              onCambiar={(activo) => onCambiar({ categorias: alternar(categorias, categoria, activo) })}
              icono={ICONO_CATEGORIA_REPORTE[categoria]}
              conteo={conteoCategorias[categoria]}
              className="max-w-full text-left"
            >
              <span className="min-w-0">{t(NOMBRE_CATEGORIA_REPORTE_MAPA_UI[categoria] ?? NOMBRE_CATEGORIA_REPORTE[categoria])}</span>
            </FilterChip>
          ))}
        </div>
      </fieldset>
      <fieldset data-guia="mapa.filtro_estado">
        <legend className="mb-2 font-mono text-xs font-medium tracking-[0.08em] text-tinta-suave uppercase">{t("Estado municipal")}</legend>
        <div className="flex flex-wrap gap-2">
          {ESTADOS_MUNICIPALES.map((estado) => (
            <FilterChip
              key={estado}
              seleccionado={estados.includes(estado)}
              onCambiar={(activo) => onCambiar({ estados: alternar(estados, estado, activo) })}
              icono={ICONO_ESTADO_MUNICIPAL[estado]}
              conteo={conteoEstados[estado]}
              className="max-w-full text-left"
            >
              <span className="min-w-0">{t(ETIQUETA_ESTADO_MUNICIPAL_MAPA_UI[estado] ?? ETIQUETA_ESTADO_MUNICIPAL[estado])}</span>
            </FilterChip>
          ))}
        </div>
        <p className="mt-2 text-xs text-tinta-suave">
          {t("El estado municipal es lo que informa el Ayuntamiento. La verificación ciudadana se muestra aparte en cada reporte.")}
        </p>
      </fieldset>
    </div>
  );
}
