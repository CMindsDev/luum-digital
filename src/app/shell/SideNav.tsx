import { Link, useLocation } from "react-router";
import { useActiveIdentity } from "@/app/session/store";
import { seccionDeRuta, seccionesVisibles, type SeccionNavegacion } from "@/app/navigation";
import { cx } from "@/design-system";

const GRUPOS: { titulo: string; ids: SeccionNavegacion["id"][] }[] = [
  { titulo: "Servicios", ids: ["inicio", "servicios", "reportes", "mapa", "bienestar"] },
  { titulo: "Lo tuyo", ids: ["participacion", "expediente", "gestiones", "notificaciones"] },
  { titulo: "Demostración", ids: ["operador", "cuenta"] },
];

/**
 * Navegación lateral: completa en escritorio (≥ 1024 px) y compacta (ícono + nombre corto) en
 * tableta (768–1023 px). En móvil se oculta: la reemplaza la barra inferior.
 */
export function SideNav() {
  const { pathname } = useLocation();
  const identidad = useActiveIdentity();
  const visibles = seccionesVisibles(identidad.rol);
  const activa = seccionDeRuta(pathname);

  return (
    <nav
      aria-label="Principal"
      className="sticky top-(--altura-encabezado) hidden h-[calc(100dvh-var(--altura-encabezado))] w-(--ancho-nav-lateral) shrink-0 overflow-y-auto border-r border-borde bg-superficie md:block"
    >
      <div className="flex flex-col gap-4 px-2 py-4 lg:px-4 lg:py-6">
        {GRUPOS.map((grupo) => {
          const secciones = visibles.filter((seccion) => grupo.ids.includes(seccion.id));
          if (secciones.length === 0) return null;
          return (
            <div key={grupo.titulo}>
              <p className="mb-1.5 hidden px-3 text-xs font-semibold tracking-[0.12em] text-tinta-suave uppercase lg:block">{grupo.titulo}</p>
              <ul className="flex flex-col gap-1">
                {secciones.map((seccion) => {
                  const actual = activa?.id === seccion.id;
                  const Icono = seccion.icono;
                  return (
                    <li key={seccion.id}>
                      <Link
                        to={seccion.ruta}
                        aria-current={actual ? "page" : undefined}
                        data-guia={seccion.guia}
                        className={cx(
                          "group flex min-h-12 flex-col items-center justify-center gap-1 rounded-boton px-1 py-2 text-center transition-colors lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-left",
                          actual ? "bg-marino text-white" : "text-tinta hover:bg-marino-suave hover:text-marino",
                        )}
                      >
                        <span
                          className={cx(
                            "inline-flex size-9 shrink-0 items-center justify-center rounded-[0.7rem]",
                            actual ? "bg-lima-logo text-marino" : "text-marino",
                          )}
                        >
                          <Icono aria-hidden="true" className="size-5" />
                        </span>
                        <span aria-hidden="true" className="text-[0.6875rem] leading-tight font-semibold break-words lg:hidden">
                          {seccion.etiquetaCorta}
                        </span>
                        <span className="sr-only text-[0.9375rem] leading-snug font-semibold lg:not-sr-only">{seccion.etiqueta}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
