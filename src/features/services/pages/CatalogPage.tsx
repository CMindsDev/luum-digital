import { SearchX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { useCategories, useServices } from "@/services/hooks";
import { Button, Chip, EmptyState, ErrorState, LoadingState, PageHeader, SectionLabel } from "@/design-system";
import { ETIQUETA_FILTRO_INFORMACION, ETIQUETA_TIPO_RECORRIDO } from "@/components/catalogo";
import type { FiltroCatalogo } from "@/types";
import { BuscadorCatalogo } from "../components/BuscadorCatalogo";
import { CuadriculaCategorias } from "../components/CuadriculaCategorias";
import { FiltrosCatalogo } from "../components/FiltrosCatalogo";
import { ListaServicios } from "../components/ListaServicios";
import { PanelCobertura } from "../components/PanelCobertura";
import { escribirFiltro, hayBusqueda, leerFiltro } from "../lib/filtros";

/** /servicios — Catálogo Municipal integrado: buscador, filtros, categorías y cobertura honesta. */
export default function CatalogPage() {
  const { t } = useTranslation();
  const [parametros, setParametros] = useSearchParams();
  const filtro = leerFiltro(parametros);
  const categorias = useCategories();
  const servicios = useServices(filtro);
  const buscando = hayBusqueda(filtro);

  const cambiar = (cambios: Partial<Record<keyof FiltroCatalogo, string | undefined>>) =>
    setParametros(escribirFiltro(parametros, cambios), { replace: true });
  const limpiar = () =>
    setParametros(escribirFiltro(parametros, { texto: undefined, categoria: undefined, estadoDeInformacion: undefined, tipoDeRecorrido: undefined }), {
      replace: true,
    });

  const nombreCategoria = categorias.data?.find((categoria) => categoria.id === filtro.categoria)?.nombre;
  const chips = [
    filtro.texto ? { id: "texto", texto: `«${filtro.texto}»`, quitar: () => cambiar({ texto: undefined }) } : null,
    filtro.categoria ? { id: "categoria", texto: nombreCategoria ?? filtro.categoria, quitar: () => cambiar({ categoria: undefined }) } : null,
    filtro.estadoDeInformacion ? { id: "info", texto: t(ETIQUETA_FILTRO_INFORMACION[filtro.estadoDeInformacion]), quitar: () => cambiar({ estadoDeInformacion: undefined }) } : null,
    filtro.tipoDeRecorrido ? { id: "tipo", texto: t(ETIQUETA_TIPO_RECORRIDO[filtro.tipoDeRecorrido]), quitar: () => cambiar({ tipoDeRecorrido: undefined }) } : null,
  ].filter((chip) => chip !== null);

  return (
    <>
      <PageHeader
        destacado
        antetitulo={t("Catálogo municipal")}
        titulo={t("Trámites y servicios")}
        descripcion={t("Busca entre las fichas que publica el Ayuntamiento, revisa requisitos y fuente, y empieza tu gestión simulada sin salir de la app.")}
      />

      <div className="flex flex-col gap-8">
        <section aria-label={t("Buscar y filtrar")} className="flex flex-col gap-4 rounded-tarjeta border border-borde bg-superficie p-4 shadow-suave sm:p-5">
          <BuscadorCatalogo key={filtro.texto ?? ""} inicial={filtro.texto} onBuscar={(texto) => cambiar({ texto: texto || undefined })} />
          <FiltrosCatalogo filtro={filtro} categorias={categorias.data} onCambiar={cambiar} />
        </section>

        {buscando ? (
          <section aria-labelledby="titulo-resultados">
            <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 id="titulo-resultados" className="text-xl font-semibold text-marino">
                {t("Resultados")}
              </h2>
              <p aria-live="polite" className="text-sm text-tinta-suave">
                {servicios.data ? (servicios.data.length === 1 ? t("1 servicio") : t("{{total}} servicios", { total: servicios.data.length })) : ""}
              </p>
            </div>
            {chips.length > 0 ? (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-tinta-suave">{t("Filtros:")}</span>
                {chips.map((chip) => (
                  <Chip key={chip.id} onQuitar={chip.quitar} etiquetaQuitar={t("Quitar el filtro {{filtro}}", { filtro: chip.texto })}>
                    {chip.texto}
                  </Chip>
                ))}
                <Button variante="fantasma" tamano="sm" onClick={limpiar} data-guia="servicios.limpiar_filtros">
                  {t("Limpiar todo")}
                </Button>
              </div>
            ) : null}
            {servicios.isPending ? (
              <LoadingState etiqueta={t("Buscando en el catálogo…")} variante="tarjetas" />
            ) : servicios.isError ? (
              <ErrorState error={servicios.error} onReintentar={() => void servicios.refetch()} />
            ) : servicios.data.length === 0 ? (
              <EmptyState
                icono={SearchX}
                titulo={t("No encontramos servicios con esa búsqueda")}
                descripcion={t("Prueba con otras palabras (por ejemplo «pago», «beca» o «licencia») o quita algún filtro. El catálogo sólo incluye fichas publicadas por fuentes oficiales.")}
                accion={
                  <Button variante="secundario" onClick={limpiar}>
                    {t("Limpiar búsqueda y filtros")}
                  </Button>
                }
              />
            ) : (
              <ListaServicios key={parametros.toString()} servicios={servicios.data} etiqueta={t("Servicios encontrados")} />
            )}
          </section>
        ) : (
          <>
            <section aria-labelledby="titulo-categorias">
              <SectionLabel as="p" className="mb-1">
                {t("Explora por tema")}
              </SectionLabel>
              <h2 id="titulo-categorias" className="mb-4 text-xl font-semibold text-marino">
                {t("Categorías")}
              </h2>
              <CuadriculaCategorias />
            </section>

            <PanelCobertura totalCatalogo={servicios.data?.length} />

            <section aria-labelledby="titulo-todos">
              <h2 id="titulo-todos" className="mb-1 text-xl font-semibold text-marino">
                {t("Todos los servicios")}
              </h2>
              <p className="mb-4 text-sm text-tinta-suave">{t("Primero los que tienen información verificada.")}</p>
              {servicios.isPending ? (
                <LoadingState etiqueta={t("Cargando servicios…")} variante="tarjetas" />
              ) : servicios.isError ? (
                <ErrorState error={servicios.error} onReintentar={() => void servicios.refetch()} />
              ) : servicios.data.length === 0 ? (
                <EmptyState titulo={t("El catálogo está vacío")} descripcion={t("No hay fichas cargadas en este momento.")} />
              ) : (
                <ListaServicios servicios={servicios.data} etiqueta={t("Todos los servicios")} />
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}
