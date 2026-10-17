import { ArrowRight } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router";
import { cx } from "../lib/cx";

export type TonoBanda = "salud" | "seguridad" | "movilidad" | "ambiente" | "tramites" | "territorio" | "azul";
export type AlineacionBanda = "izquierda" | "derecha" | "centro";

export interface FotoBanda {
  src: string;
  /** Texto alternativo; vacío (por omisión) si la foto es decorativa. */
  alt?: string;
  /** object-position, p. ej. "50% 34%" para recortar un tercio superior. */
  posicion?: string;
}

export interface EnlaceBanda {
  etiqueta: string;
  /** Ruta interna. */
  to: string;
  /** Identificador estable para el asistente (data-guia). */
  guia?: string;
}

export interface BandaTematicaProps {
  tono: TonoBanda;
  /** Primera línea del titular (Host Grotesk). */
  lineaSans: string;
  /** Segunda línea o palabra destacada (Instrument Serif itálica). */
  lineaSerif?: string;
  /** Pie descriptor en IBM Plex Mono, en mayúsculas (por CSS). */
  pie?: ReactNode;
  /** Ícono decorativo: ruta de una imagen (ver ICONOS_BANDA) o un elemento propio. */
  icono?: string | ReactNode;
  foto?: FotoBanda;
  /** Alineación del texto en escritorio; en móvil y tableta todo va a la izquierda (salvo «centro»). */
  alineacion?: AlineacionBanda;
  /** Titular largo (p. ej. «Medio ambiente»): escala ×0.83, como en el tablero. */
  largo?: boolean;
  enlaces?: EnlaceBanda[];
  /** Acciones adicionales junto a los enlaces (p. ej. un botón de ayuda inmediata). */
  children?: ReactNode;
  /** Nivel del encabezado: 2 (por omisión) o 1 si la banda abre la pantalla. */
  nivel?: 1 | 2;
  /** Esquinas redondeadas de 32 px; con false la banda va a sangre completa. */
  redondeada?: boolean;
  id?: string;
  className?: string;
}

/*
 * Bandas del tablero 32:162 (04–09) con las correcciones de contraste de ESPECIFICACION_FIGMA.md §7:
 * - salud: azul #0D63E8 sólido con el degradado crema → azul sólo como franja decorativa superior; el
 *   texto (crema, 5.02:1) queda siempre sobre azul. Un velo claro bajo texto claro daba 1.72:1.
 * - seguridad: magenta fuerte #C2307F (blanco 5.22:1); con #F62FA2 el pie de 16 px sólo daba 3.59:1.
 * - movilidad, ambiente y trámites: café sobre ámbar 6.16:1, lima clara 9.84:1 y lima 6.07:1.
 * - territorio: blanco sobre café 10.84:1. azul: blanco sobre #005BE8 5.74:1.
 * Los enlaces son píldoras con contraste propio (marino sobre blanco 12.06:1; crema sobre café 10.27:1).
 * El foco se pinta de blanco sobre fondos oscuros y de café sobre claros (≥ 3:1 en todos).
 */
const ESTILOS: Record<TonoBanda, { fondo: string; texto: string; enlace: string; foco: string }> = {
  salud: {
    fondo: "bg-azul-salud",
    texto: "text-crema",
    enlace: "bg-superficie text-marino hover:bg-crema",
    foco: "[--color-foco:var(--color-superficie)]",
  },
  seguridad: {
    fondo: "bg-magenta-fuerte",
    texto: "text-white",
    enlace: "bg-superficie text-marino hover:bg-crema",
    foco: "[--color-foco:var(--color-superficie)]",
  },
  movilidad: {
    fondo: "bg-ambar",
    texto: "text-cafe",
    enlace: "bg-cafe text-crema hover:bg-marino",
    foco: "[--color-foco:var(--color-cafe)]",
  },
  ambiente: {
    fondo: "bg-lima-clara",
    texto: "text-cafe",
    enlace: "bg-cafe text-crema hover:bg-marino",
    foco: "[--color-foco:var(--color-cafe)]",
  },
  tramites: {
    fondo: "bg-lima",
    texto: "text-cafe",
    enlace: "bg-cafe text-crema hover:bg-marino",
    foco: "[--color-foco:var(--color-cafe)]",
  },
  territorio: {
    fondo: "bg-cafe",
    texto: "text-white",
    enlace: "bg-superficie text-marino hover:bg-crema",
    foco: "[--color-foco:var(--color-superficie)]",
  },
  azul: {
    fondo: "bg-azul",
    texto: "text-white",
    enlace: "bg-superficie text-marino hover:bg-crema",
    foco: "[--color-foco:var(--color-superficie)]",
  },
};

const ALINEACION: Record<AlineacionBanda, { columna: string; acciones: string }> = {
  izquierda: { columna: "items-start text-left", acciones: "justify-start" },
  derecha: { columna: "items-start text-left @5xl/banda:items-end @5xl/banda:text-right", acciones: "justify-start @5xl/banda:justify-end" },
  centro: { columna: "items-center text-center", acciones: "justify-center" },
};

/*
 * Titular a la medida de su columna: cada línea es una unidad sin saltos (como en el tablero) y el tamaño
 * es el menor entre el del tablero (105.2 px; 87.3 px en titulares largos), el 16 % del ancho de la columna
 * (≈ 50–56 px en 390 px) y el que cabe en ella (100cqi ÷ ancho estimado de la línea en em). La estimación es
 * conservadora para que tampoco se desborde con las fuentes de respaldo mientras cargan.
 */
const EM_POR_LETRA_SANS = 0.52;
const EM_POR_LETRA_SERIF = 0.46;
const PROPORCION_SERIF = 1.14; // 120 / 105.218 en el tablero

function medidaTitular(lineaSans: string, lineaSerif: string | undefined, largo: boolean): CSSProperties {
  const ancho = Math.max(
    lineaSans.trim().length * EM_POR_LETRA_SANS,
    (lineaSerif?.trim().length ?? 0) * EM_POR_LETRA_SERIF * PROPORCION_SERIF,
    1,
  );
  const maximo = largo ? "5.456rem" : "6.576rem";
  const estilo: CSSProperties & { "--titulo-sans": string } = {
    "--titulo-sans": `max(2rem, min(${maximo}, 16cqi, calc(100cqi / ${ancho.toFixed(2)})))`,
  };
  return estilo;
}

/**
 * Banda de sección temática del tablero del Laboratorio: fondo de color, ícono, titular en dos líneas
 * (Host Grotesk + Instrument Serif itálica), pie en IBM Plex Mono y foto con radio grande. Responsiva
 * por contenedor: en pantallas angostas apila ícono → titular → pie → foto (todo a la izquierda) y en
 * anchas pone texto y foto en dos columnas, alternando el lado según `alineacion`. No va dentro de
 * flujos transaccionales: es para portadas de categoría e inicio.
 */
export function BandaTematica({
  tono,
  lineaSans,
  lineaSerif,
  pie,
  icono,
  foto,
  alineacion = "izquierda",
  largo = false,
  enlaces = [],
  children,
  nivel = 2,
  redondeada = true,
  id,
  className,
}: BandaTematicaProps) {
  const estilo = ESTILOS[tono];
  const disposicion = ALINEACION[alineacion];
  const centrada = alineacion === "centro";
  const idTitulo = `${id ?? `banda-${tono}`}-titulo`;
  const Titular = nivel === 1 ? "h1" : "h2";
  const dosColumnas = Boolean(foto) && !centrada;

  return (
    <section
      id={id}
      aria-labelledby={idTitulo}
      data-tono={tono}
      className={cx("@container/banda relative isolate overflow-hidden", redondeada && "rounded-mosaico", estilo.fondo, estilo.texto, estilo.foco, className)}
    >
      {tono === "salud" ? (
        // Franja decorativa del degradado crema → azul; el texto empieza debajo, sobre azul sólido.
        <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-20 bg-linear-to-b from-crema to-azul-salud @3xl/banda:h-28" />
      ) : null}
      <div
        className={cx(
          "grid gap-10 px-5 pt-10 pb-12 @3xl/banda:px-12 @3xl/banda:pt-14 @3xl/banda:pb-16 @5xl/banda:items-center @5xl/banda:gap-12 @5xl/banda:px-[8.5cqw] @5xl/banda:py-20",
          tono === "salud" && "pt-24 @3xl/banda:pt-32 @5xl/banda:pt-36",
          dosColumnas && alineacion === "izquierda" && "@5xl/banda:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]",
          // La foto va primero (a la izquierda): la columna ancha es la segunda.
          dosColumnas && alineacion === "derecha" && "@5xl/banda:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)]",
        )}
      >
        <div className={cx("@container/texto flex min-w-0 flex-col", disposicion.columna)} style={medidaTitular(lineaSans, lineaSerif, largo)}>
          {typeof icono === "string" ? (
            <img src={icono} alt="" aria-hidden="true" decoding="async" className="h-auto w-14 select-none @3xl/banda:w-18 @5xl/banda:w-[5.5rem]" />
          ) : (
            icono
          )}
          <Titular
            id={idTitulo}
            tabIndex={nivel === 1 ? -1 : undefined}
            className={cx(
              "mt-8 w-full text-current font-normal tracking-titulo leading-titulo break-words @5xl/banda:mt-12",
              alineacion === "derecha" && "@5xl/banda:pr-[0.05em]",
            )}
          >
            <span className="block text-(length:--titulo-sans) whitespace-nowrap">{lineaSans.trim()}</span>
            {lineaSerif ? (
              <>
                {" "}
                <span className="block text-[length:calc(var(--titulo-sans)*1.14)] font-serif font-normal tracking-titulo-serif whitespace-nowrap italic">
                  {lineaSerif.trim()}
                </span>
              </>
            ) : null}
          </Titular>
          {pie ? (
            <p
              className={cx(
                "mt-6 font-mono-rotulo text-rotulo leading-rotulo font-medium tracking-rotulo uppercase @5xl/banda:mt-10",
                centrada ? "max-w-[53rem]" : "max-w-[30rem]",
              )}
            >
              {pie}
            </p>
          ) : null}
          {enlaces.length > 0 || children ? (
            <div className={cx("mt-7 flex flex-wrap gap-3", disposicion.acciones)}>
              {enlaces.map((enlace) => (
                <Link
                  key={enlace.to}
                  to={enlace.to}
                  data-guia={enlace.guia}
                  className={cx(
                    "group inline-flex min-h-12 items-center gap-2 rounded-pildora px-5 text-base font-semibold no-underline shadow-suave transition-colors",
                    estilo.enlace,
                  )}
                >
                  {enlace.etiqueta}
                  <ArrowRight aria-hidden="true" className="size-4 shrink-0 transition-transform motion-safe:group-hover:translate-x-0.5" />
                </Link>
              ))}
              {children}
            </div>
          ) : null}
        </div>
        {foto ? (
          <div
            className={cx(
              "w-full max-w-[26rem] shrink-0",
              centrada ? "mx-auto" : "@5xl/banda:max-w-[24.7rem]",
              alineacion === "derecha" && "@5xl/banda:order-first",
              alineacion === "izquierda" && "@5xl/banda:justify-self-end",
            )}
          >
            <img
              src={foto.src}
              alt={foto.alt ?? ""}
              width={370}
              height={400}
              loading="lazy"
              decoding="async"
              style={foto.posicion ? { objectPosition: foto.posicion } : undefined}
              className="aspect-[370/400] w-full rounded-(--radius-foto-movil) object-cover @5xl/banda:aspect-[395/427] @5xl/banda:rounded-foto"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
