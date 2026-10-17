import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { CLASES_ICONO_CATEGORIA, ICONO_CATEGORIA_REPORTE, TONO_CATEGORIA_REPORTE } from "@/components/reportes/categorias-reporte";
import { SectionLabel, cx } from "@/design-system";
import { NOMBRE_CATEGORIA_REPORTE_UI } from "../../lib/i18n";
import { DESCRIPCION_CATEGORIA, TIPOS_REPORTE } from "../../lib/tipos-reporte";

/** «Catálogo de reportes»: todos los tipos («Elige el tipo de atención que necesitas»). */
export function CatalogoReportes() {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="catalogo-reportes">
      <SectionLabel id="catalogo-reportes">{t("Catálogo de reportes")}</SectionLabel>
      <p className="mt-1 mb-3 text-[0.9375rem] text-tinta-suave">{t("Elige el tipo de atención que necesitas.")}</p>
      <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        {TIPOS_REPORTE.map((categoria) => {
          const Icono = ICONO_CATEGORIA_REPORTE[categoria];
          return (
            <li key={categoria}>
              <Link
                to={`/reportes/nuevo/${categoria}`}
                data-guia={`reportes.${categoria}`}
                className="group flex min-h-16 items-center gap-3 rounded-tarjeta border border-borde bg-superficie p-3 text-tinta no-underline shadow-suave transition-shadow hover:shadow-elevada"
              >
                <span
                  aria-hidden="true"
                  className={cx("inline-flex size-12 shrink-0 items-center justify-center rounded-boton", CLASES_ICONO_CATEGORIA[TONO_CATEGORIA_REPORTE[categoria]])}
                >
                  <Icono className="size-6" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-marino">{t(NOMBRE_CATEGORIA_REPORTE_UI[categoria])}</span>
                  <span className="block text-sm text-tinta-suave">{t(DESCRIPCION_CATEGORIA[categoria])}</span>
                </span>
                <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-tinta-suave transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
