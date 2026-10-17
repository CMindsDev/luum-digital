import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { cx, SectionLabel } from "@/design-system";
import { ACCESO_DESTACADO, ACCESOS_RAPIDOS, type TonoAcceso } from "../lib/accesos";

/** Fondos del tablero. El glifo (crema o café) cumple ≥ 3:1 como gráfico; la etiqueta va fuera del mosaico. */
const FONDO: Record<TonoAcceso, string> = {
  azul: "bg-azul",
  ambar: "bg-ambar",
  cafe: "bg-cafe",
  magenta: "bg-magenta",
  lima: "bg-lima",
};

/*
 * Rejilla de 4 columnas sobre fondo marino: fila 1 con cuatro mosaicos y
 * fila 2 con el mosaico lima y el banner en las columnas 2–4. El alto del banner es el de un mosaico:
 * (100cqw − 3 huecos) / 4. Las etiquetas van debajo, en blanco sobre el fondo marino.
 */
const CLASES_ENLACE =
  "group flex h-full cursor-pointer flex-col items-center gap-2 rounded-[1.25rem] p-1 text-center no-underline outline-offset-4 sm:gap-3";

/** Respuesta al cursor, teclado y pulsación; sin movimiento cuando la persona lo reduce. */
const INTERACCION_MOSAICO =
  "transition-transform duration-(--duracion-lenta) ease-suave group-focus-visible:ring-2 group-focus-visible:ring-crema motion-safe:group-hover:-translate-y-0.5 motion-safe:group-focus-visible:-translate-y-0.5 motion-safe:group-active:translate-y-0 motion-safe:group-active:scale-[0.99] motion-reduce:transition-none";

export function AccesosRapidos() {
  const { t } = useTranslation();
  const reducirMovimiento = useReducedMotion();
  const animarEntrada = !reducirMovimiento && typeof IntersectionObserver !== "undefined";

  return (
    <section aria-labelledby="titulo-accesos">
      <SectionLabel id="titulo-accesos" className="mb-3">
        {t("Accesos rápidos")}
      </SectionLabel>
      <div className="superficie-oscura w-full overflow-hidden rounded-[2rem] bg-marino px-3 py-6 sm:px-8 sm:py-10 lg:py-14">
        <ul className="@container grid w-full grid-cols-4 gap-x-(--hueco) gap-y-5 [--hueco:0.625rem] sm:gap-y-7 sm:[--hueco:1.25rem] lg:[--hueco:1.75rem]">
          {ACCESOS_RAPIDOS.map((acceso, indice) => (
            <motion.li
              key={acceso.ruta}
              initial={false}
              whileInView={animarEntrada ? { y: [0, -8, 0], scale: [1, 1.025, 1] } : undefined}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.9, delay: indice * 0.1, ease: "easeInOut" }}
            >
              <Link to={acceso.ruta} data-guia={acceso.guia} className={CLASES_ENLACE}>
                <span
                  aria-hidden="true"
                  className={cx(
                    "flex aspect-square w-full items-center justify-center rounded-[17.5%]",
                    INTERACCION_MOSAICO,
                    FONDO[acceso.tono],
                  )}
                >
                  <img src={acceso.glifo} alt="" className="w-[66%] select-none" decoding="async" />
                </span>
                <span className="text-[0.8125rem] leading-tight font-semibold text-white underline-offset-4 group-focus-visible:underline sm:text-[0.9375rem] lg:text-base">{t(acceso.etiqueta)}</span>
              </Link>
            </motion.li>
          ))}
          <motion.li
            className="col-span-3"
            initial={false}
            whileInView={animarEntrada ? { y: [0, -8, 0], scale: [1, 1.015, 1] } : undefined}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.9, delay: ACCESOS_RAPIDOS.length * 0.1, ease: "easeInOut" }}
          >
            <Link to={ACCESO_DESTACADO.ruta} data-guia={ACCESO_DESTACADO.guia} className={CLASES_ENLACE}>
              <span className={cx("relative flex h-[calc((100cqw_-_3_*_var(--hueco))_/_4_-_0.5rem)] w-full items-center overflow-hidden rounded-[clamp(0.875rem,4cqw,2rem)] bg-linear-to-r from-crema from-0% to-azul to-58%", INTERACCION_MOSAICO)}>
                <span aria-hidden="true" className="absolute top-1/2 left-[34%] h-[47%] w-[42%] -translate-x-1/2 -translate-y-1/2">
                  <img
                    src="/brand/laboratorio/tablero/patron-cadena-banner.svg"
                    alt=""
                    className="absolute top-1/2 left-1/2 h-[clamp(4rem,30cqw,16rem)] w-[calc(clamp(4rem,30cqw,16rem)_*_0.336)] max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90 select-none"
                  />
                </span>
                <span className="relative ml-auto flex w-[40%] flex-col items-start pr-[3%] text-left text-crema">
                  <span className="text-[0.9375rem] leading-tight font-semibold sm:text-xl lg:text-2xl">{t(ACCESO_DESTACADO.etiqueta)}</span>
                  <span className="sr-only mt-0.5 items-center gap-1 text-sm font-medium sm:not-sr-only sm:inline-flex lg:text-base">
                    {t(ACCESO_DESTACADO.descripcion)}
                    <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-(--duracion-lenta) ease-suave motion-safe:group-hover:translate-x-0.5 motion-safe:group-focus-visible:translate-x-0.5 motion-reduce:transition-none" />
                  </span>
                </span>
              </span>
            </Link>
          </motion.li>
        </ul>
      </div>
    </section>
  );
}
