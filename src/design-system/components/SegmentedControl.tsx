import type { LucideIcon } from "lucide-react";
import { useRef, type KeyboardEvent } from "react";
import { cx } from "../lib/cx";
import { indiceConTeclado } from "../lib/roving";

export interface OpcionSegmento<T extends string> {
  valor: T;
  etiqueta: string;
  icono?: LucideIcon;
}

export interface SegmentedControlProps<T extends string> {
  /** Nombre accesible del grupo. */
  etiqueta: string;
  opciones: OpcionSegmento<T>[];
  valor: T;
  onCambiar: (valor: T) => void;
  /** Ocupa todo el ancho disponible. */
  anchoCompleto?: boolean;
  guia?: string;
  className?: string;
}

/** Control segmentado (role="radiogroup") con roving tabindex y flechas. */
export function SegmentedControl<T extends string>({ etiqueta, opciones, valor, onCambiar, anchoCompleto = false, guia, className }: SegmentedControlProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const indiceActivo = Math.max(
    0,
    opciones.findIndex((opcion) => opcion.valor === valor),
  );

  const alTeclear = (evento: KeyboardEvent<HTMLButtonElement>) => {
    const destino = indiceConTeclado(evento, indiceActivo, opciones.length, { vertical: true });
    const opcion = destino === null ? undefined : opciones[destino];
    if (destino === null || !opcion) return;
    evento.preventDefault();
    onCambiar(opcion.valor);
    refs.current[destino]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={etiqueta}
      data-guia={guia}
      className={cx("inline-flex max-w-full gap-1 rounded-boton border border-borde bg-superficie-2 p-1", anchoCompleto && "flex w-full", className)}
    >
      {opciones.map((opcion, indice) => {
        const seleccionada = indice === indiceActivo;
        const Icono = opcion.icono;
        return (
          <button
            key={opcion.valor}
            ref={(elemento) => {
              refs.current[indice] = elemento;
            }}
            type="button"
            role="radio"
            aria-checked={seleccionada}
            tabIndex={seleccionada ? 0 : -1}
            onClick={() => onCambiar(opcion.valor)}
            onKeyDown={alTeclear}
            className={cx(
              "inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-[0.65rem] px-3 text-sm font-semibold transition-colors",
              anchoCompleto && "flex-1",
              seleccionada ? "bg-marino text-white shadow-suave" : "text-tinta hover:bg-superficie",
            )}
          >
            {Icono ? <Icono aria-hidden="true" className="size-4 shrink-0" /> : null}
            <span className="truncate">{opcion.etiqueta}</span>
          </button>
        );
      })}
    </div>
  );
}
