import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "react-router";
import { AyudaInmediata } from "@/components/ayuda/AyudaInmediata";
import { cx } from "@/design-system";
import type { FondoTema, TemaInicio } from "../lib/temas";
import { FUENTE_MONO_ROTULO, FUENTE_SERIF_ACENTO } from "../lib/tipografia";

/*
 * Banda temática del tablero Figma 32:162 (bandas 04–09) con las correcciones de contraste de
 * ESPECIFICACION_FIGMA.md §7:
 * - Salud: el degradado crema → azul termina antes del texto (crema sobre azul 5.44:1).
 * - Seguridad: magenta fuerte de fondo (blanco 5.11:1); el magenta del tablero sólo da 3.59:1.
 * - Movilidad, Medio ambiente y Trámites: texto café sobre ámbar 6.16:1, lima clara 9.84:1, lima 6.07:1.
 * - Desarrollo Urbano: blanco sobre café 10.84:1.
 * En superficies oscuras el foco pasa a lima del logotipo (superficie-oscura); en claras, a café.
 */
const ESTILO: Record<FondoTema, { fondo: string; texto: string; boton: string; oscuro: boolean }> = {
  salud: {
    fondo:
      "bg-[linear-gradient(180deg,var(--color-crema)_0,var(--color-azul-salud,var(--color-azul))_8rem)] @5xl/banda:bg-[linear-gradient(180deg,var(--color-crema)_0,var(--color-azul-salud,var(--color-azul))_11rem)]",
    texto: "text-crema",
    boton: "bg-superficie text-marino hover:bg-crema",
    oscuro: true,
  },
  seguridad: { fondo: "bg-magenta-fuerte", texto: "text-white", boton: "bg-superficie text-marino hover:bg-crema", oscuro: true },
  movilidad: { fondo: "bg-ambar", texto: "text-cafe", boton: "bg-cafe text-crema hover:bg-marino", oscuro: false },
  medio_ambiente: {
    fondo: "bg-[var(--color-lima-clara,var(--color-amarillo-lima,var(--color-lima-suave)))]",
    texto: "text-cafe",
    boton: "bg-cafe text-crema hover:bg-marino",
    oscuro: false,
  },
  tramites: { fondo: "bg-lima", texto: "text-cafe", boton: "bg-cafe text-crema hover:bg-marino", oscuro: false },
  territorio: { fondo: "bg-cafe", texto: "text-white", boton: "bg-superficie text-marino hover:bg-crema", oscuro: true },
};

/*
 * Titular a la medida de su columna: cada línea es una unidad (sin saltos dentro de la línea, como en el
 * tablero) y el tamaño es el menor entre el del tablero y el que cabe en la columna (100cqi de la
 * columna de texto ÷ ancho estimado de la línea en em). La estimación es conservadora para que tampoco
 * se desborde con las fuentes de respaldo mientras cargan Host Grotesk e Instrument Serif.
 */
const EM_POR_LETRA_SANS = 0.58;
const EM_POR_LETRA_SERIF = 0.52;
const PROPORCION_SERIF = 1.14; // 120 / 105.218 en el tablero

function metricaTitulo(tema: TemaInicio): CSSProperties {
  const ancho = Math.max(
    tema.lineaSans.trim().length * EM_POR_LETRA_SANS,
    tema.lineaSerif.trim().length * EM_POR_LETRA_SERIF * PROPORCION_SERIF,
  );
  const maximo = tema.largo ? "5.456rem" : "6.576rem";
  const estilo: CSSProperties & { "--titulo-sans": string } = { "--titulo-sans": `min(${maximo}, calc(100cqi / ${ancho.toFixed(2)}))` };
  return estilo;
}

export interface BandaTemaProps {
  tema: TemaInicio;
}

export function BandaTema({ tema }: BandaTemaProps) {
  const estilo = ESTILO[tema.id];
  const centrada = tema.alineacion === "centro";
  const idTitulo = `tema-${tema.id}`;

  const foto = (
    <div
      className={cx(
        "min-w-0 w-full max-w-[26rem] lg:mx-0 lg:justify-self-end",
        centrada && "mx-auto",
      )}
    >
      <img
        src={tema.foto}
        alt=""
        loading="lazy"
        decoding="async"
        style={tema.posicionFoto ? { objectPosition: tema.posicionFoto } : undefined}
        className="aspect-[370/400] w-full rounded-[2rem] object-cover lg:aspect-[395/427] lg:rounded-[3.125rem]"
      />
    </div>
  );

  return (
    <section
      aria-labelledby={idTitulo}
      data-tema={tema.id}
      className={cx("@container/banda", estilo.fondo, estilo.texto, estilo.oscuro ? "superficie-oscura" : "[--color-foco:var(--color-cafe)]")}
    >
      <div
        className={cx(
          "grid gap-10 px-5 pt-10 pb-12 @3xl/banda:px-12 @3xl/banda:pt-14 @3xl/banda:pb-16 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:items-center lg:gap-[clamp(1.5rem,4cqw,4rem)] lg:px-[clamp(1.5rem,5cqw,5rem)] lg:py-20",
          tema.id === "salud" && "pt-14 @3xl/banda:pt-20",
        )}
      >
        <div className={cx("@container/texto flex min-w-0 flex-col lg:items-start lg:text-left", centrada ? "items-center text-center" : "items-start text-left")} style={metricaTitulo(tema)}>
          <img
            src={tema.icono}
            alt=""
            aria-hidden="true"
            decoding="async"
            className="h-auto w-14 select-none @3xl/banda:w-18 @5xl/banda:w-[5.5rem]"
          />
          <h3
            id={idTitulo}
            className="mt-8 w-full font-normal leading-[0.972] tracking-[-0.05em] break-words text-current lg:mt-10"
          >
            <span className="block text-(length:--titulo-sans) whitespace-nowrap">{tema.lineaSans.trim()}</span>{" "}
            <span className={cx("block text-[length:calc(var(--titulo-sans)*1.14)] tracking-[-0.044em] whitespace-nowrap italic", FUENTE_SERIF_ACENTO)}>
              {tema.lineaSerif.trim()}
            </span>
          </h3>
          <p
            className={cx(
              FUENTE_MONO_ROTULO,
              "mt-6 text-sm leading-[1.83] font-medium tracking-[0.05em] uppercase @5xl/banda:mt-10 @5xl/banda:text-base",
              centrada ? "max-w-[53rem]" : "max-w-[30rem]",
            )}
          >
            {tema.descriptor}
          </p>
          <div className={cx("mt-7 flex flex-wrap gap-3 lg:justify-start", centrada ? "justify-center" : "justify-start")}>
            {tema.enlaces.map((enlace) => (
              <Link
                key={enlace.ruta}
                to={enlace.ruta}
                data-guia={enlace.guia}
                className={cx(
                  "group inline-flex min-h-12 items-center gap-2 rounded-pildora px-5 text-base font-semibold no-underline shadow-suave transition-colors",
                  estilo.boton,
                )}
              >
                {enlace.etiqueta}
                <ArrowRight aria-hidden="true" className="size-4 shrink-0 transition-transform motion-safe:group-hover:translate-x-0.5" />
              </Link>
            ))}
            {tema.conAyudaInmediata ? <AyudaInmediata variante="boton" guia="inicio.tema_ayuda_inmediata" enfoque="violencia" className="min-h-12 rounded-pildora" /> : null}
          </div>
        </div>
        {foto}
      </div>
    </section>
  );
}
