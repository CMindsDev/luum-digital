import type { CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cx } from "@/design-system";
import type { EstadoMascota } from "./estado-mascota";
import "./pekito-mascota.css";
import type { ExpertoAsistente } from "@shared/asistente/expertos";
import { AVATARES, DURACION_MORPH_MS } from "./expertos";

/** Proporciones del recurso exportado de Figma (nodo 34:1586, 212.885 × 198.681). */
const ANCHO = 212.885;
const ALTO = 198.681;

/** Centros de los cuatro huecos del cuerpo (en unidades del recurso): se iluminan como luces de estado. */
const LUCES = [
  { x: 133.7, y: 85.6 },
  { x: 133.3, y: 126.3 },
  { x: 92.1, y: 146.3 },
  { x: 51.1, y: 166.5 },
] as const;

/** Debajo de este ancho los efectos (burbujas, ondas, chispas) estorban más de lo que dicen. */
const ANCHO_MINIMO_EFECTOS = 72;

const ESTRELLA = "M0 -10 L2.6 -2.6 L10 0 L2.6 2.6 L0 10 L-2.6 2.6 L-10 0 L-2.6 -2.6 Z";

export interface PekitoAnimadoProps {
  estado: EstadoMascota;
  /** Ancho en píxeles; el alto conserva la proporción del diseño. */
  ancho?: number;
  /** Nivel de voz 0..1 (lo usa «hablando» para modular luces y cuerpo). */
  nivel?: number;
  className?: string;
  experto?: ExpertoAsistente;
  estatico?: boolean;
}

/**
 * Pekito animado. El cuerpo es el recurso de Figma sin cambios; los huecos funcionan como luces
 * (detrás del cuerpo) y los efectos (burbujas de pensamiento, ondas, chispas…) rodean la figura.
 * Los estados usan CSS y el cambio de figura usa un morph visual con Motion, sin alterar los SVG.
 * Con movimiento reducido conserva poses fijas. El estado lo comunica el texto que lo acompaña.
 */
export function PekitoAnimado({ estado, ancho = ANCHO, nivel, className, experto = "general", estatico = false }: PekitoAnimadoProps) {
  const reducido = useReducedMotion();
  const alto = Math.round((ancho * ALTO) / ANCHO);
  const efectos = ancho >= ANCHO_MINIMO_EFECTOS;
  const estilo = nivel === undefined ? undefined : ({ "--nivel": Math.min(1, Math.max(0, nivel)).toFixed(2) } as CSSProperties);
  const avatar = AVATARES[experto];
  const escala = Math.min(ANCHO / avatar.ancho, ALTO / avatar.alto);
  const anchoImagen = avatar.ancho * escala;
  const altoImagen = avatar.alto * escala;

  return (
    <svg
      viewBox={`0 0 ${ANCHO} ${ALTO}`}
      width={ancho}
      height={alto}
      aria-hidden="true"
      focusable="false"
      data-estado={estado}
      data-experto={experto}
      data-estatico={estatico || undefined}
      data-pekito-animado
      style={estilo}
      className={cx("pekito-mascota block select-none", className)}
    >
      {efectos ? (
        <g className="pk-fx pk-fx-atras">
          <g className="pk-fx-escuchar">
            <circle className="pk-onda" cx="133.5" cy="90" r="74" />
            <circle className="pk-onda pk-onda-2" cx="133.5" cy="90" r="74" />
          </g>
          <circle className="pk-fx-conectar" cx="99" cy="112" r="98" />
        </g>
      ) : null}

      <g className="pk-cuerpo">
        <AnimatePresence initial={false}>
          <motion.g
            key={experto}
            data-avatar-capa={experto}
            initial={reducido ? false : { opacity: 0, scaleX: 0.92, scaleY: 1.06, filter: "blur(3px)" }}
            animate={reducido ? { opacity: 1 } : { opacity: [0, 0.75, 1], scaleX: [0.92, 1.02, 1], scaleY: [1.06, 0.99, 1], filter: ["blur(3px)", "blur(1px)", "blur(0px)"] }}
            exit={reducido ? { opacity: 0 } : { opacity: 0, scaleX: 1.04, scaleY: 0.96, filter: "blur(3px)" }}
            transition={{ duration: reducido ? 0 : DURACION_MORPH_MS / 1000, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: `${ANCHO / 2}px ${ALTO / 2}px` }}
          >
            {experto === "general" ? <g className="pk-luces">
              {LUCES.map((luz, indice) => (
                <circle key={indice} className="pk-luz" style={{ "--i": indice } as CSSProperties} cx={luz.x} cy={luz.y} r="11.2" />
              ))}
            </g> : null}
            <image href={`/brand/laboratorio/agente/${avatar.ruta}`} x={(ANCHO - anchoImagen) / 2} y={ALTO - altoImagen} width={anchoImagen} height={altoImagen} />
          </motion.g>
        </AnimatePresence>
      </g>

      {efectos ? (
        <g className="pk-fx pk-fx-frente">
          <g className="pk-fx-pensar">
            <circle className="pk-punto" cx="172" cy="44" r="2.8" />
            <circle className="pk-punto" cx="186" cy="27" r="4" />
            <circle className="pk-punto" cx="204" cy="8" r="5.8" />
          </g>

          <g className="pk-fx-hablar">
            <path className="pk-arco" d="M197 76 Q207 88 197 100" />
            <path className="pk-arco pk-arco-2" d="M205 66 Q221 88 205 110" />
          </g>

          <g className="pk-fx-trabajar">
            <g transform="translate(56 72)">
              <path className="pk-chispa" d={ESTRELLA} />
            </g>
            <g transform="translate(84 104) scale(0.7)">
              <path className="pk-chispa pk-chispa-2" d={ESTRELLA} />
            </g>
            <g transform="translate(34 112) scale(0.55)">
              <path className="pk-chispa pk-chispa-3" d={ESTRELLA} />
            </g>
          </g>

          <g className="pk-fx-feliz">
            <g transform="translate(150 24)">
              <path className="pk-estrella" d={ESTRELLA} />
            </g>
            <g transform="translate(184 40) scale(0.7)">
              <path className="pk-estrella pk-estrella-2" d={ESTRELLA} />
            </g>
            <g transform="translate(118 22) scale(0.6)">
              <path className="pk-estrella pk-estrella-3" d={ESTRELLA} />
            </g>
          </g>

          <g className="pk-fx-triste">
            <g transform="translate(176 58)">
              <path className="pk-gota" d="M0 -7 C3.5 -2 6 1 6 4 A6 6 0 1 1 -6 4 C-6 1 -3.5 -2 0 -7 Z" />
            </g>
          </g>

          <g className="pk-fx-zzz">
            <text className="pk-z" x="176" y="44" fontSize="16">
              z
            </text>
            <text className="pk-z pk-z-2" x="190" y="26" fontSize="22">
              z
            </text>
          </g>
        </g>
      ) : null}
    </svg>
  );
}
