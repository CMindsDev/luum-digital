import { CircleAlert, type LucideIcon } from "lucide-react";
import { useId, type ReactNode } from "react";
import { cx } from "../lib/cx";

export interface OpcionRadioCard<T extends string> {
  valor: T;
  etiqueta: string;
  descripcion?: ReactNode;
  icono?: LucideIcon;
  /** Contenido adicional a la derecha (p. ej. una insignia de rol). */
  extra?: ReactNode;
  deshabilitada?: boolean;
}

export interface RadioCardGroupProps<T extends string> {
  /** Texto del <legend>. */
  leyenda: ReactNode;
  ocultarLeyenda?: boolean;
  name?: string;
  opciones: OpcionRadioCard<T>[];
  valor: T | null | undefined;
  onCambiar: (valor: T) => void;
  ayuda?: ReactNode;
  error?: string;
  requerido?: boolean;
  columnas?: 1 | 2 | 3 | 4;
  /** Prefijo para data-guia de cada opción (p. ej. "cuenta.identidad" → cuenta.identidad_ana). */
  guia?: string;
  className?: string;
}

const COLUMNAS = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 xl:grid-cols-4" } as const;

/**
 * Grupo de opciones tipo tarjeta sobre radios nativos (flechas del teclado, un solo tabulador).
 * El estado seleccionado se muestra con borde, fondo e indicador, no sólo con color.
 */
export function RadioCardGroup<T extends string>({
  leyenda,
  ocultarLeyenda = false,
  name,
  opciones,
  valor,
  onCambiar,
  ayuda,
  error,
  requerido = false,
  columnas = 1,
  guia,
  className,
}: RadioCardGroupProps<T>) {
  const base = useId().replace(/:/g, "");
  const nombre = name ?? `grupo-${base}`;
  const idAyuda = ayuda ? `${base}-ayuda` : undefined;
  const idError = error ? `${base}-error` : undefined;

  return (
    <fieldset
      className={cx("min-w-0", className)}
      aria-describedby={[idAyuda, idError].filter(Boolean).join(" ") || undefined}
      aria-invalid={error ? true : undefined}
      aria-required={requerido || undefined}
    >
      <legend className={cx("mb-1.5 text-[0.9375rem] font-semibold text-tinta", ocultarLeyenda && "sr-only")}>
        {leyenda}
        {requerido ? <span className="text-peligro" aria-hidden="true"> *</span> : null}
      </legend>
      {ayuda ? (
        <p id={idAyuda} className="mb-2 text-sm text-tinta-suave">
          {ayuda}
        </p>
      ) : null}
      <div className={cx("grid grid-cols-1 gap-2.5", COLUMNAS[columnas])}>
        {opciones.map((opcion) => {
          const seleccionada = opcion.valor === valor;
          const Icono = opcion.icono;
          const idOpcion = `${base}-${opcion.valor}`;
          return (
            <label
              key={opcion.valor}
              htmlFor={idOpcion}
              data-guia={guia ? `${guia}_${opcion.valor}` : undefined}
              className={cx(
                "relative flex min-h-14 cursor-pointer items-start gap-3 rounded-tarjeta border-2 bg-superficie p-4 transition-colors",
                "has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-foco",
                seleccionada ? "border-marino bg-marino-suave" : "border-borde hover:border-marino/50",
                opcion.deshabilitada && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                id={idOpcion}
                type="radio"
                name={nombre}
                value={opcion.valor}
                checked={seleccionada}
                disabled={opcion.deshabilitada}
                required={requerido}
                onChange={() => onCambiar(opcion.valor)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={cx(
                  "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                  seleccionada ? "border-marino" : "border-borde-control",
                )}
              >
                {seleccionada ? <span className="size-2.5 rounded-full bg-marino" /> : null}
              </span>
              {Icono ? <Icono aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-marino" /> : null}
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-tinta">{opcion.etiqueta}</span>
                {opcion.descripcion ? <span className="mt-0.5 block text-sm text-tinta-suave">{opcion.descripcion}</span> : null}
              </span>
              {opcion.extra ? <span className="shrink-0">{opcion.extra}</span> : null}
            </label>
          );
        })}
      </div>
      {error ? (
        <p id={idError} className="mt-2 flex items-start gap-1.5 text-sm font-medium text-peligro">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
