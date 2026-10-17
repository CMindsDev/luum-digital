import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "react-router";
import { AyudaInmediata } from "@/components/ayuda/AyudaInmediata";
import { cx } from "@/design-system";
import type { AlineacionTema, FondoTema, TemaInicio } from "../lib/temas";
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

/** En móvil y tableta todo va a la izquierda (el texto alineado a la derecha se lee mal en pantallas angostas). */
const ALINEACION: Record<AlineacionTema, { columna: string; acciones: string }> = {
  izquierda: { columna: "items-start text-left", acciones: "justify-start" },
  derecha: { columna: "items-start text-left @5xl/banda:items-end @5xl/banda:text-right", acciones: "justify-start @5xl/banda:justify-end" },
  centro: { columna: "items-center text-center", acciones: "justify-center" },
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
  const alineacion = ALINEACION[tema.alineacion];
  const centrada = tema.alineacion === "centro";
  const idTitulo = `tema-${tema.id}`;

  const foto = (
    <div
      className={cx(
        "w-full max-w-[26rem] shrink-0",
        centrada ? "mx-auto" : "@5xl/banda:max-w-[24.7rem]",
        tema.alineacion === "derecha" && "@5xl/banda:order-first",
        tema.alineacion === "izquierda" && "@5xl/banda:justify-self-end",
      )}
    >
      <img
        src={tema.foto}
        alt=""
        loading="lazy"
        decoding="async"
        style={tema.posicionFoto ? { objectPosition: tema.posicionFoto } : undefined}
        className="aspect-[370/400] w-full rounded-[2rem] object-cover @5xl/banda:aspect-[395/427] @5xl/banda:rounded-[3.125rem]"
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
          "grid gap-10 px-5 pt-10 pb-12 @3xl/banda:px-12 @3xl/banda:pt-14 @3xl/banda:pb-16 @5xl/banda:items-center @5xl/banda:gap-12 @5xl/banda:px-[8.5cqw] @5xl/banda:py-24",
          tema.id === "salud" && "pt-14 @3xl/banda:pt-20",
          tema.alineacion === "izquierda" &&
            (tema.largo ? "@5xl/banda:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]" : "@5xl/banda:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]"),
          // La foto va primero (a la izquierda): la columna ancha es la segunda.
          tema.alineacion === "derecha" && "@5xl/banda:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)]",
        )}
      >
        <div className={cx("@container/texto flex min-w-0 flex-col", alineacion.columna)} style={metricaTitulo(tema)}>
          <img
            src={tema.icono}
            alt=""
            aria-hidden="true"
            decoding="async"
            className="h-auto w-14 select-none @3xl/banda:w-18 @5xl/banda:w-[5.5rem]"
          />
          <h3
            id={idTitulo}
            className={cx(
              "mt-8 w-full font-normal leading-[0.972] tracking-[-0.05em] break-words text-current @5xl/banda:mt-12",
              tema.alineacion === "derecha" && "@5xl/banda:pr-[0.05em]",
            )}
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
          <div className={cx("mt-7 flex flex-wrap gap-3", alineacion.acciones)}>
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
