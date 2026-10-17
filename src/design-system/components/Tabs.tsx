import type { LucideIcon } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "../lib/cx";
import { indiceConTeclado } from "../lib/roving";

export interface Pestana {
  id: string;
  etiqueta: string;
  contenido: ReactNode;
  icono?: LucideIcon;
  /** Conteo opcional (p. ej. elementos en la pestaña). */
  conteo?: number;
}

export interface TabsProps {
  /** Nombre accesible de la lista de pestañas. */
  etiqueta: string;
  pestanas: Pestana[];
  /** Controlado: id seleccionado. */
  seleccionada?: string;
  onCambiar?: (id: string) => void;
  /** No controlado: id inicial. */
  inicial?: string;
  className?: string;
}

/** Pestañas WAI-ARIA con roving tabindex: ←/→, Inicio y Fin mueven el foco y activan la pestaña. */
export function Tabs({ etiqueta, pestanas, seleccionada, onCambiar, inicial, className }: TabsProps) {
  const base = useId().replace(/:/g, "");
  const [interna, setInterna] = useState(inicial ?? pestanas[0]?.id ?? "");
  const activa = seleccionada ?? interna;
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const indiceActivo = Math.max(
    0,
    pestanas.findIndex((pestana) => pestana.id === activa),
  );

  const activar = (indice: number, enfocar = false) => {
    const pestana = pestanas[indice];
    if (!pestana) return;
    if (seleccionada === undefined) setInterna(pestana.id);
    onCambiar?.(pestana.id);
    if (enfocar) refs.current[indice]?.focus();
  };

  const alTeclear = (evento: KeyboardEvent<HTMLButtonElement>) => {
    const destino = indiceConTeclado(evento, indiceActivo, pestanas.length);
    if (destino === null) return;
    evento.preventDefault();
    activar(destino, true);
  };

  return (
    <div className={className}>
      <div role="tablist" aria-label={etiqueta} className="flex gap-1 overflow-x-auto rounded-boton bg-superficie-2 p-1">
        {pestanas.map((pestana, indice) => {
          const seleccion = indice === indiceActivo;
          const Icono = pestana.icono;
          return (
            <button
              key={pestana.id}
              ref={(elemento) => {
                refs.current[indice] = elemento;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${pestana.id}`}
              aria-selected={seleccion}
              aria-controls={`${base}-panel-${pestana.id}`}
              tabIndex={seleccion ? 0 : -1}
              onClick={() => activar(indice)}
              onKeyDown={alTeclear}
              className={cx(
                "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[0.65rem] px-4 text-sm font-semibold whitespace-nowrap transition-colors",
                seleccion ? "bg-superficie text-marino shadow-suave" : "text-tinta-suave hover:text-marino",
              )}
            >
              {Icono ? <Icono aria-hidden="true" className="size-4" /> : null}
              {pestana.etiqueta}
              {pestana.conteo !== undefined ? (
                <span className={cx("rounded-pildora px-2 text-xs leading-5", seleccion ? "bg-marino text-white" : "bg-superficie text-tinta")}>
                  {pestana.conteo}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {pestanas.map((pestana, indice) => (
        <div
          key={pestana.id}
          role="tabpanel"
          id={`${base}-panel-${pestana.id}`}
          aria-labelledby={`${base}-tab-${pestana.id}`}
          tabIndex={0}
          hidden={indice !== indiceActivo}
          className="mt-4 rounded-boton"
        >
          {indice === indiceActivo ? pestana.contenido : null}
        </div>
      ))}
    </div>
  );
}
