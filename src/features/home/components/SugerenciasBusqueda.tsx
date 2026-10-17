import { Search } from "lucide-react";
import { Link } from "react-router";
import { cx } from "@/design-system";
import { CONSULTAS_SUGERIDAS } from "../lib/acciones";
import { destinoDeBusqueda } from "../lib/destino-busqueda";
import { FUENTE_MONO_ROTULO } from "../lib/tipografia";

export interface SugerenciasBusquedaProps {
  titulo?: string;
  /** Nivel del encabezado (h2 por omisión). */
  nivel?: 2 | 3;
  className?: string;
}

/** Consultas de ejemplo en lenguaje natural (las seis del brief). */
export function SugerenciasBusqueda({ titulo = "Prueba con", nivel = 2, className }: SugerenciasBusquedaProps) {
  const Titulo = nivel === 2 ? "h2" : "h3";
  return (
    <div className={className}>
      <Titulo className={cx("text-xs font-medium tracking-[0.12em] text-tinta-suave uppercase", FUENTE_MONO_ROTULO)}>{titulo}</Titulo>
      <ul className="mt-3 flex flex-wrap gap-2">
        {CONSULTAS_SUGERIDAS.map((consulta, indice) => {
          const destino = destinoDeBusqueda(consulta);
          return (
            <li key={consulta}>
              <Link
                to={destino.to}
                state={destino.state}
                data-guia={`busqueda.sugerencia_${indice + 1}`}
                className={cx(
                  "inline-flex min-h-11 items-center gap-2 rounded-pildora border border-borde bg-superficie px-4 text-[0.9375rem] font-medium text-marino no-underline shadow-suave",
                  "transition-colors hover:border-azul hover:bg-azul-suave",
                )}
              >
                <Search aria-hidden="true" className="size-4 shrink-0 text-azul" />
                {consulta}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
