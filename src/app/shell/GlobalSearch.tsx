import { Search } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";

/** Buscador global del encabezado de escritorio: envía a /buscar?q=. */
export function GlobalSearch() {
  const navigate = useNavigate();
  const [parametros] = useSearchParams();
  const [consulta, setConsulta] = useState(() => parametros.get("q") ?? "");
  const id = useId();

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const texto = consulta.trim();
    navigate(texto ? `/buscar?q=${encodeURIComponent(texto)}` : "/buscar");
  };

  return (
    <form role="search" onSubmit={enviar} className="relative w-full max-w-md" data-guia="encabezado.buscador">
      <label htmlFor={id} className="sr-only">
        Buscar trámites, servicios o reportes
      </label>
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-tinta-suave" />
      <input
        id={id}
        type="search"
        value={consulta}
        onChange={(evento) => setConsulta(evento.target.value)}
        placeholder="¿Qué necesitas? p. ej. «bache en mi calle»"
        autoComplete="off"
        enterKeyHint="search"
        className="h-11 w-full rounded-pildora border border-transparent bg-superficie pr-24 pl-11 text-[0.9375rem] text-tinta placeholder:text-tinta-suave focus-visible:outline-lima-logo"
      />
      <button
        type="submit"
        className="absolute top-1 right-1 inline-flex h-9 items-center rounded-pildora bg-lima-logo px-4 text-sm font-semibold text-marino hover:bg-lima"
      >
        Buscar
      </button>
    </form>
  );
}
