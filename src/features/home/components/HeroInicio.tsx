import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { cx } from "@/design-system";
import { msg } from "@/i18n";
import { destinoDeBusqueda } from "../lib/destino-busqueda";
import { FUENTE_SERIF_ACENTO } from "../lib/tipografia";
import { CampoBusqueda } from "./CampoBusqueda";

const ATAJOS = [msg("Quiero reportar un bache"), msg("Quiero consultar mi folio"), msg("Busco apoyo psicológico")] as const;

export interface HeroInicioProps {
  nombre: string;
}

/**
 * Héroe del tablero Figma 32:162 (nodo 4:336): saludo como Mérida Móvil y, debajo, la tarjeta con el
 * degradado de 132.81° crema → azul, el isotipo crema (decorativo, no es el logotipo institucional) y
 * el buscador en lenguaje natural. El saludo va sobre el fondo crema de la página (marino 11.43:1):
 * sobre el degradado el texto marino bajaba a ~2.5:1. El buscador y los atajos llevan superficie propia.
 */
export function HeroInicio({ nombre }: HeroInicioProps) {
  const { t } = useTranslation();

  return (
    <section aria-labelledby="saludo-inicio" className="flex flex-col gap-4 sm:gap-6">
      <div>
        <h1 id="saludo-inicio" tabIndex={-1} className="text-[2.25rem] leading-[1.02] font-semibold tracking-[-0.03em] text-marino sm:text-5xl lg:text-6xl">
          {t("Hola, {{nombre}}", { nombre })}
        </h1>
        <p className={cx("mt-1.5 text-[1.625rem] leading-tight text-marino italic sm:text-4xl lg:text-[2.75rem]", FUENTE_SERIF_ACENTO)}>
          {t("¿Qué quieres hacer hoy?")}
        </p>
      </div>

      <div className="relative isolate overflow-hidden rounded-[2rem] bg-[linear-gradient(132.81deg,var(--color-crema)_1.338%,var(--color-azul)_56.086%)] px-5 pt-6 pb-6 sm:px-9 sm:py-10 lg:px-12 lg:py-14">
        <img
          src="/brand/laboratorio/tablero/isotipo-merida-blanco.svg"
          alt=""
          aria-hidden="true"
          decoding="async"
          className="pointer-events-none absolute right-5 bottom-5 -z-10 h-auto w-16 select-none sm:top-1/2 sm:right-9 sm:bottom-auto sm:w-28 sm:-translate-y-1/2 lg:right-12 lg:w-40"
        />
        <div className="sm:max-w-[calc(100%_-_9rem)] lg:max-w-[min(calc(100%_-_13rem),48rem)]">
          <CampoBusqueda etiqueta={t("Describe lo que necesitas")} guia="inicio.buscador" />
          <ul aria-label={t("Ejemplos de búsqueda")} className="mt-4 flex flex-wrap items-center gap-2 pr-20 sm:pr-0">
            {ATAJOS.map((atajo) => {
              const destino = destinoDeBusqueda(atajo);
              return (
                <li key={atajo}>
                  <Link
                    to={destino.to}
                    state={destino.state}
                    className="inline-flex min-h-11 items-center rounded-pildora bg-superficie px-4 text-sm font-medium text-marino shadow-suave transition-colors hover:bg-crema"
                  >
                    {t(atajo)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
