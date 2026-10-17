import { LayoutGrid, Map as MapIcon, Megaphone, Type } from "lucide-react";
import { ButtonLink, cx, EmptyState, ErrorState, LoadingState } from "@/design-system";
import { useCatalogSearch } from "@/services/hooks";
import { PanelIntencion } from "./PanelIntencion";
import { ResultadosCatalogo } from "./ResultadosCatalogo";
import { SugerenciasBusqueda } from "./SugerenciasBusqueda";
import { FUENTE_MONO_ROTULO } from "../lib/tipografia";

export interface ContenidoBusquedaProps {
  consulta: string;
}

/**
 * Estados de /buscar: sin consulta (sugerencias), consulta muy corta, carga, error (con reintento y
 * aviso de sin conexión vía ErrorState), y éxito con intención + fichas (vacío con sugerencias).
 */
export function ContenidoBusqueda({ consulta }: ContenidoBusquedaProps) {
  const busqueda = useCatalogSearch(consulta);

  if (consulta === "") {
    return (
      <div className="space-y-8">
        <SugerenciasBusqueda />
        <section aria-labelledby="titulo-explorar">
          <h2 id="titulo-explorar" className={cx("text-xs font-medium tracking-[0.12em] text-tinta-suave uppercase", FUENTE_MONO_ROTULO)}>
            O explora
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <ButtonLink to="/servicios" variante="secundario" tamano="sm" iconoInicio={LayoutGrid}>
              Trámites y servicios
            </ButtonLink>
            <ButtonLink to="/reportes" variante="secundario" tamano="sm" iconoInicio={Megaphone}>
              Reportes
            </ButtonLink>
            <ButtonLink to="/mapa" variante="secundario" tamano="sm" iconoInicio={MapIcon}>
              Mapa de la ciudad
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
        titulo="Escribe un poco más"
        descripcion="Necesito al menos dos letras para buscar. También puedes probar con un ejemplo."
        accion={<SugerenciasBusqueda titulo="Ejemplos" nivel={3} className="text-left" />}
      />
    );
  }

  if (busqueda.isError && !busqueda.data) {
    return <ErrorState error={busqueda.error} onReintentar={() => void busqueda.refetch()} />;
  }

  if (!busqueda.data) {
    return <LoadingState etiqueta="Buscando en el catálogo…" variante="tarjetas" />;
  }

  const actualizando = busqueda.isPlaceholderData || busqueda.data.consulta !== consulta;

  return (
    <div className="space-y-8" aria-busy={actualizando || undefined}>
      {actualizando ? <LoadingState etiqueta="Actualizando resultados…" variante="compacto" /> : null}
      {busqueda.isError ? <ErrorState error={busqueda.error} onReintentar={() => void busqueda.refetch()} /> : null}
      <PanelIntencion key={`intencion-${busqueda.data.consulta}`} consulta={busqueda.data.consulta} intencion={busqueda.data.intencion} />
      <ResultadosCatalogo key={`resultados-${busqueda.data.consulta}`} consulta={busqueda.data.consulta} resultados={busqueda.data.resultados} />
    </div>
  );
}
