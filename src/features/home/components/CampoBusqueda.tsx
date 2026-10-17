import { Search } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { cx } from "@/design-system";
import { destinoDeBusqueda, LARGO_MAXIMO_CONSULTA } from "../lib/destino-busqueda";

export interface CampoBusquedaProps {
  /** Texto inicial del campo (p. ej. la consulta actual de /buscar). */
  valorInicial?: string;
  /** Etiqueta accesible del campo. */
  etiqueta: string;
  /** Muestra la etiqueta encima del campo (si no, queda sólo para lectores de pantalla). */
  etiquetaVisible?: boolean;
  /** Texto de ayuda bajo el campo (asociado con aria-describedby). */
  ayuda?: string;
  placeholder?: string;
  /** Identificador estable para el asistente (data-guia) del formulario. */
  guia: string;
  className?: string;
}

/**
 * Buscador en lenguaje natural: envía a /buscar?q= (o, si la consulta trata de salud mental o
 * violencia, a /buscar con la consulta fuera de la URL). La intención y los resultados los calcula la
 * pantalla de búsqueda con useCatalogSearch.
 */
export function CampoBusqueda({
  valorInicial = "",
  etiqueta,
  etiquetaVisible = false,
  ayuda,
  placeholder = "p. ej. «bache frente a mi casa»",
  guia,
  className,
}: CampoBusquedaProps) {
  const navigate = useNavigate();
  const [consulta, setConsulta] = useState(valorInicial);
  const idCampo = useId();
  const idAyuda = useId();

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const destino = destinoDeBusqueda(consulta);
    navigate(destino.to, { state: destino.state });
  };

  return (
    <form role="search" aria-label={etiqueta} onSubmit={enviar} className={cx("w-full", className)} data-guia={guia}>
      <label htmlFor={idCampo} className={etiquetaVisible ? "mb-2 block text-sm font-semibold text-tinta" : "sr-only"}>
        {etiqueta}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-tinta-suave" />
          <input
            id={idCampo}
            type="search"
            name="q"
            value={consulta}
            onChange={(evento) => setConsulta(evento.target.value)}
            placeholder={placeholder}
            enterKeyHint="search"
            autoComplete="off"
            maxLength={LARGO_MAXIMO_CONSULTA}
            aria-describedby={ayuda ? idAyuda : undefined}
            className="h-14 w-full rounded-pildora border border-borde-control bg-superficie pr-4 pl-12 text-base text-tinta shadow-suave placeholder:text-tinta-suave"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-pildora bg-marino px-7 text-base font-semibold text-white shadow-suave transition-colors hover:bg-marino-portal"
        >
          Buscar
        </button>
      </div>
      {ayuda ? (
        <p id={idAyuda} className="mt-2 text-sm text-tinta-suave">
          {ayuda}
        </p>
      ) : null}
    </form>
  );
}
