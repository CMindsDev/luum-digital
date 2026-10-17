import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type { SeccionId, SeccionNavegacion } from "@/app/navigation";
import { cx, Sheet } from "@/design-system";
import { CLASES_ICONO_ACCESO } from "@/design-system/lib/tonos";

interface MoreSheetProps {
  abierto: boolean;
  onCerrar: () => void;
  secciones: SeccionNavegacion[];
  activa?: SeccionId;
}

/** Hoja «Más» de la barra inferior: el resto de secciones, sin ocultar ninguna. */
export function MoreSheet({ abierto, onCerrar, secciones, activa }: MoreSheetProps) {
  const { t } = useTranslation();
  return (
    <Sheet abierto={abierto} onCerrar={onCerrar} titulo={t("Más secciones")}>
      <nav aria-label={t("Más secciones")}>
        <ul className="flex flex-col gap-1.5">
          {secciones.map((seccion) => {
            const Icono = seccion.icono;
            const actual = activa === seccion.id;
            return (
              <li key={seccion.id}>
                <Link
                  to={seccion.ruta}
                  onClick={onCerrar}
                  aria-current={actual ? "page" : undefined}
                  data-guia={`${seccion.guia}_mas`}
                  className={cx(
                    "flex min-h-14 items-center gap-3 rounded-boton px-3 py-2 transition-colors",
                    actual ? "bg-marino-suave" : "hover:bg-superficie-2",
                  )}
                >
                  <span className={cx("inline-flex size-10 shrink-0 items-center justify-center rounded-boton text-marino", CLASES_ICONO_ACCESO[seccion.tono])}>
                    <Icono aria-hidden="true" className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-marino">{t(seccion.etiqueta)}</span>
                    <span className="block text-sm text-tinta-suave">{t(seccion.descripcion)}</span>
                  </span>
                  <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-tinta-suave" />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </Sheet>
  );
}
