import { Search } from "lucide-react";
import { useId, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { consultaDelEstado, destinoDeBusqueda, LARGO_MAXIMO_CONSULTA } from "@/features/home/lib/destino-busqueda";

/** Buscador global del encabezado de escritorio: abre /buscar y respeta la privacidad de consultas sensibles. */
export function GlobalSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [parametros] = useSearchParams();
  const consultaActual = (consultaDelEstado(location.state) ?? parametros.get("q") ?? "").slice(0, LARGO_MAXIMO_CONSULTA);
  const id = useId();

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    const destino = destinoDeBusqueda(String(datos.get("q") ?? ""));
    navigate(destino.to, { state: destino.state });
  };

  return (
    <form key={consultaActual} role="search" onSubmit={enviar} className="relative w-full max-w-md" data-guia="encabezado.buscador">
      <label htmlFor={id} className="sr-only">
        {t("Buscar trámites, servicios o reportes")}
      </label>
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-tinta-suave" />
      <input
        id={id}
        type="search"
        name="q"
        defaultValue={consultaActual}
        placeholder={t("¿Qué necesitas? p. ej. «bache en mi calle»")}
        autoComplete="off"
        enterKeyHint="search"
        maxLength={LARGO_MAXIMO_CONSULTA}
        className="h-11 w-full rounded-pildora border border-transparent bg-superficie pr-24 pl-11 text-[0.9375rem] text-tinta placeholder:text-tinta-suave focus-visible:outline-lima-logo"
      />
      <button
        type="submit"
        className="absolute top-1 right-1 inline-flex h-9 items-center rounded-pildora bg-lima-logo px-4 text-sm font-semibold text-marino hover:bg-lima"
      >
        {t("Buscar")}
      </button>
    </form>
  );
}
