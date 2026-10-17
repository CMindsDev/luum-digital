import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { PageHeader } from "@/design-system";
import { CampoBusqueda } from "../components/CampoBusqueda";
import { ContenidoBusqueda } from "../components/ContenidoBusqueda";
import { consultaDelEstado, esConsultaSensible, LARGO_MAXIMO_CONSULTA } from "../lib/destino-busqueda";

/**
 * /buscar?q=: búsqueda en lenguaje natural sobre el catálogo (useCatalogSearch). Muestra la intención
 * detectada con acciones concretas y las fichas que coinciden; cada resultado abre una vista interna.
 */
export default function SearchPage() {
  const { t } = useTranslation();
  const [parametros] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const consultaUrl = (parametros.get("q") ?? "").slice(0, LARGO_MAXIMO_CONSULTA);
  const consulta = (consultaDelEstado(location.state) ?? consultaUrl).trim();
  const sensible = consultaUrl.trim() !== "" && esConsultaSensible(consultaUrl);

  useEffect(() => {
    if (sensible) navigate({ pathname: "/buscar", search: "" }, { replace: true, state: { consulta: consultaUrl.trim() } });
  }, [sensible, consultaUrl, navigate]);

  return (
    <>
      <PageHeader titulo={t("Buscar")} descripcion={t("Dime qué necesitas y te llevo a la pantalla donde lo resuelves.")} />
      <div className="mb-8 max-w-3xl">
        <CampoBusqueda
          key={consulta}
          valorInicial={consulta}
          etiqueta={t("¿Qué necesitas?")}
          etiquetaVisible
          ayuda={t("Escribe con tus palabras. Buscamos en trámites, dependencias y la plataforma, y citamos la fuente de cada dato.")}
          guia="busqueda.campo"
        />
        <p className="mt-2 text-sm text-tinta-suave">{t("Las consultas sobre salud mental o violencia no se envían a ningún servicio.")}</p>
      </div>
      <ContenidoBusqueda consulta={consulta} />
    </>
  );
}
