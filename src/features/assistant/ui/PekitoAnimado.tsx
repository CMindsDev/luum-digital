import type { CSSProperties } from "react";
import { cx } from "@/design-system";
import type { EstadoMascota } from "./estado-mascota";
import "./pekito-mascota.css";

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
}

/**
 * Pekito animado. El cuerpo es el recurso de Figma sin cambios; los huecos funcionan como luces
 * (detrás del cuerpo) y los efectos (burbujas de pensamiento, ondas, chispas…) rodean la figura.
 * Todo es CSS (`pekito-mascota.css`): con movimiento reducido queda quieto pero cada estado conserva
 * una pose distinta (luces fijas). Es decorativo: el estado lo comunica el texto que lo acompaña.
 */
export function PekitoAnimado({ estado, ancho = ANCHO, nivel, className }: PekitoAnimadoProps) {
  const alto = Math.round((ancho * ALTO) / ANCHO);
  const efectos = ancho >= ANCHO_MINIMO_EFECTOS;
  const estilo = nivel === undefined ? undefined : ({ "--nivel": Math.min(1, Math.max(0, nivel)).toFixed(2) } as CSSProperties);

  return (
    <svg
      viewBox={`0 0 ${ANCHO} ${ALTO}`}
      width={ancho}
      height={alto}
      aria-hidden="true"
      focusable="false"
      data-estado={estado}
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
        <g className="pk-luces">
          {LUCES.map((luz, indice) => (
            <circle key={indice} className="pk-luz" style={{ "--i": indice } as CSSProperties} cx={luz.x} cy={luz.y} r="11.2" />
          ))}
        </g>
        <image href="/brand/laboratorio/agente/pekito-mascota.svg" width={ANCHO} height={ALTO} />
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
