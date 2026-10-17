import { LayoutGrid, Map as MapIcon, Megaphone, Type } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ButtonLink, cx, EmptyState, ErrorState, LoadingState } from "@/design-system";
import { useCatalogSearch } from "@/services/hooks";
import { FUENTE_MONO_ROTULO } from "../lib/tipografia";
import { PanelIntencion } from "./PanelIntencion";
import { RespuestaInteligente } from "./RespuestaInteligente";
import { ResultadosCatalogo } from "./ResultadosCatalogo";
import { SugerenciasBusqueda } from "./SugerenciasBusqueda";

export interface ContenidoBusquedaProps {
  consulta: string;
}

/**
 * Estados de /buscar: sin consulta (sugerencias), consulta muy corta, carga, error (con reintento y
 * aviso de sin conexión vía ErrorState), y éxito con intención + fichas (vacío con sugerencias).
 */
export function ContenidoBusqueda({ consulta }: ContenidoBusquedaProps) {
  const { t } = useTranslation();
  const busqueda = useCatalogSearch(consulta);

  if (consulta === "") {
    return (
      <div className="space-y-8">
        <SugerenciasBusqueda />
        <section aria-labelledby="titulo-explorar">
          <h2 id="titulo-explorar" className={cx("text-xs font-medium tracking-[0.12em] text-tinta-suave uppercase", FUENTE_MONO_ROTULO)}>
            {t("O explora")}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <ButtonLink to="/servicios" variante="secundario" tamano="sm" iconoInicio={LayoutGrid}>
              {t("Trámites y servicios")}
            </ButtonLink>
            <ButtonLink to="/reportes" variante="secundario" tamano="sm" iconoInicio={Megaphone}>
              {t("Reportes")}
            </ButtonLink>
            <ButtonLink to="/mapa" variante="secundario" tamano="sm" iconoInicio={MapIcon}>
              {t("Mapa de la ciudad")}
            </ButtonLink>
          </div>
        </section>
      </div>
    );
  }

  if (consulta.length < 2) {
    return (
      <EmptyState
        icono={Type}
        titulo={t("Escribe un poco más")}
        descripcion={t("Necesito al menos dos letras para buscar. También puedes probar con un ejemplo.")}
        accion={<SugerenciasBusqueda titulo="Ejemplos" nivel={3} className="text-left" />}
      />
    );
  }

  if (busqueda.isError && !busqueda.data) {
    return (
      <div className="space-y-8">
        <RespuestaInteligente consulta={consulta} />
        <ErrorState error={busqueda.error} onReintentar={() => void busqueda.refetch()} />
      </div>
    );
  }

  if (!busqueda.data) {
    return (
      <div className="space-y-8">
        <RespuestaInteligente consulta={consulta} />
        <LoadingState etiqueta={t("Buscando en el catálogo…")} variante="tarjetas" />
      </div>
    );
  }

  const actualizando = busqueda.isPlaceholderData || busqueda.data.consulta !== consulta;

  return (
    <div className="space-y-8" aria-busy={actualizando || undefined}>
      <RespuestaInteligente consulta={consulta} />
      {actualizando ? <LoadingState etiqueta={t("Actualizando resultados…")} variante="compacto" /> : null}
      {busqueda.isError ? <ErrorState error={busqueda.error} onReintentar={() => void busqueda.refetch()} /> : null}
      <PanelIntencion key={`intencion-${busqueda.data.consulta}`} consulta={busqueda.data.consulta} intencion={busqueda.data.intencion} />
      <ResultadosCatalogo key={`resultados-${busqueda.data.consulta}`} consulta={busqueda.data.consulta} resultados={busqueda.data.resultados} />
    </div>
  );
}
