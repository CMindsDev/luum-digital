import { Ellipsis } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import { useActiveIdentity } from "@/app/session/store";
import { SECCIONES, SECCIONES_BARRA_INFERIOR, seccionDeRuta, seccionesVisibles } from "@/app/navigation";
import { cx } from "@/design-system";
import { MoreSheet } from "./MoreSheet";

const CLASE_ITEM =
  "flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-boton px-1 text-[0.75rem] leading-tight font-semibold transition-colors";

function IconoItem({ activo, children }: { activo: boolean; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex h-8 w-14 items-center justify-center rounded-pildora transition-colors",
        activo ? "bg-lima-logo text-marino" : "text-marino",
      )}
    >
      {children}
    </span>
  );
}

/** Barra inferior móvil de 5 elementos: Inicio, Servicios, Reportes, Mapa y Más. */
export function BottomNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const identidad = useActiveIdentity();
  const [masAbierto, setMasAbierto] = useState(false);
  const activa = seccionDeRuta(pathname);
  const fijas = SECCIONES.filter((seccion) => SECCIONES_BARRA_INFERIOR.includes(seccion.id));
  const resto = seccionesVisibles(identidad.rol).filter((seccion) => !SECCIONES_BARRA_INFERIOR.includes(seccion.id));
  const masActivo = Boolean(activa && !SECCIONES_BARRA_INFERIOR.includes(activa.id));

  return (
    <>
      <nav
        aria-label={t("Principal")}
        className="fixed inset-x-0 bottom-0 z-40 rounded-t-[1.5rem] border-t border-borde bg-superficie pb-[env(safe-area-inset-bottom)] shadow-barra md:hidden"
      >
        <ul className="mx-auto grid h-[4.5rem] max-w-lg grid-cols-5 items-center gap-0.5 px-1.5">
          {fijas.map((seccion) => {
            const actual = activa?.id === seccion.id;
            const Icono = seccion.icono;
            return (
              <li key={seccion.id}>
                <Link
                  to={seccion.ruta}
                  aria-current={actual ? "page" : undefined}
                  data-guia={seccion.guia}
                  className={cx(CLASE_ITEM, actual ? "text-marino" : "text-tinta-suave hover:text-marino")}
                >
                  <IconoItem activo={actual}>
                    <Icono aria-hidden="true" className="size-5" />
                  </IconoItem>
                  {t(seccion.etiquetaCorta)}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={masAbierto}
              data-guia="nav.mas"
              onClick={() => setMasAbierto(true)}
              className={cx(CLASE_ITEM, masActivo ? "text-marino" : "text-tinta-suave hover:text-marino")}
            >
              <IconoItem activo={masActivo}>
                <Ellipsis aria-hidden="true" className="size-5" />
              </IconoItem>
              {t("Más")}
            </button>
          </li>
        </ul>
      </nav>
      <MoreSheet abierto={masAbierto} onCerrar={() => setMasAbierto(false)} secciones={resto} activa={activa?.id} />
    </>
  );
}
