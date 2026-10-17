import { ICONO_CATEGORIA_REPORTE, TONO_CATEGORIA_REPORTE } from "@/components/reportes/categorias-reporte";
import { SectionLabel, Tile } from "@/design-system";
import { REPORTES_RAPIDOS } from "../../lib/tipos-reporte";

/** «Reportes rápidos» de Mérida Móvil: Bache a la vista, Desazolve de rejilla y Basura en vía pública. */
export function ReportesRapidos() {
  return (
    <section aria-labelledby="reportes-rapidos">
      <SectionLabel id="reportes-rapidos" className="mb-3">
        Reportes rápidos
      </SectionLabel>
      <ul className="grid grid-cols-1 gap-3 min-[30rem]:grid-cols-3">
        {REPORTES_RAPIDOS.map((rapido) => (
          <li key={rapido.categoria}>
            <Tile
              etiqueta={rapido.nombre}
              descripcion={rapido.descripcion}
              icono={ICONO_CATEGORIA_REPORTE[rapido.categoria]}
              tono={TONO_CATEGORIA_REPORTE[rapido.categoria]}
              to={`/reportes/nuevo/${rapido.categoria}`}
              guia={rapido.guia}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
