import { FolderSearch, SearchX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router";
import { esCategoriaId } from "@/components/catalogo";
import { useCategories, useServices } from "@/services/hooks";
import { Button, ButtonLink, EmptyState, ErrorState, LoadingState, PageHeader } from "@/design-system";
import type { FiltroCatalogo } from "@/types";
import { BuscadorCatalogo } from "../components/BuscadorCatalogo";
import { EncabezadoCategoria } from "../components/EncabezadoCategoria";
import { FiltrosCatalogo } from "../components/FiltrosCatalogo";
import { ListaServicios } from "../components/ListaServicios";
import { escribirFiltro, leerFiltro } from "../lib/filtros";

/** /servicios/categoria/:categoriaId — portada de una categoría con sus servicios y filtros. */
export default function CategoryPage() {
  const { t } = useTranslation();
  const { categoriaId } = useParams();
  const [parametros, setParametros] = useSearchParams();
  const categorias = useCategories();
  const valida = esCategoriaId(categoriaId);
  const filtroUrl = leerFiltro(parametros);
  const filtro: FiltroCatalogo = { ...filtroUrl, categoria: valida ? categoriaId : undefined };
  const servicios = useServices(filtro);

  const cambiar = (cambios: Partial<Record<keyof FiltroCatalogo, string | undefined>>) =>
    setParametros(escribirFiltro(parametros, cambios), { replace: true });
  const limpiar = () => setParametros(escribirFiltro(parametros, { texto: undefined, estadoDeInformacion: undefined, tipoDeRecorrido: undefined }), { replace: true });

  if (categorias.isPending) return <LoadingState etiqueta={t("Cargando la categoría…")} />;
  if (categorias.isError) {
    return (
      <>
        <PageHeader titulo={t("Categoría de servicios")} regresar="/servicios" />
        <ErrorState error={categorias.error} onReintentar={() => void categorias.refetch()} />
      </>
    );
  }

  const categoria = valida ? categorias.data.find((c) => c.id === categoriaId) : undefined;
  if (!categoria) {
    return (
      <>
        <PageHeader titulo={t("No encontramos esta categoría")} regresar="/servicios" />
        <EmptyState
          icono={FolderSearch}
          titulo={t("La categoría no existe en el catálogo")}
          descripcion={t("Puede que el enlace esté incompleto. Revisa las categorías disponibles en el catálogo.")}
          accion={<ButtonLink to="/servicios">{t("Ver todas las categorías")}</ButtonLink>}
        />
      </>
    );
  }

  const conFiltros = Boolean(filtroUrl.texto || filtroUrl.estadoDeInformacion || filtroUrl.tipoDeRecorrido);
  const total = servicios.data?.length;
  const rotulo = total !== undefined && !conFiltros ? (total === 1 ? t("1 ficha en el catálogo") : t("{{total}} fichas en el catálogo", { total })) : undefined;

  return (
    <>
      <EncabezadoCategoria categoria={categoria} rotulo={rotulo} />

      <div className="flex flex-col gap-6">
        <section aria-label={t("Buscar en la categoría")} className="flex flex-col gap-4 rounded-tarjeta border border-borde bg-superficie p-4 shadow-suave sm:p-5">
          <BuscadorCatalogo
            key={filtroUrl.texto ?? ""}
            inicial={filtroUrl.texto}
            etiqueta={t("Buscar en {{categoria}}", { categoria: categoria.nombre })}
            marcador={t("Escribe un trámite o servicio")}
            onBuscar={(texto) => cambiar({ texto: texto || undefined })}
          />
          <FiltrosCatalogo filtro={filtroUrl} onCambiar={cambiar} onLimpiar={limpiar} />
        </section>

        <section aria-labelledby="titulo-servicios-categoria">
          <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 id="titulo-servicios-categoria" className="text-xl font-semibold text-marino">
              {t("Servicios")}
            </h2>
            <p aria-live="polite" className="text-sm text-tinta-suave">
              {total !== undefined ? (total === 1 ? t("1 resultado") : t("{{total}} resultados", { total })) : ""}
            </p>
          </div>
          {servicios.isPending ? (
            <LoadingState etiqueta={t("Cargando servicios de la categoría…")} variante="tarjetas" />
          ) : servicios.isError ? (
            <ErrorState error={servicios.error} onReintentar={() => void servicios.refetch()} />
          ) : servicios.data.length === 0 ? (
            <EmptyState
              icono={SearchX}
              titulo={conFiltros ? t("Ningún servicio coincide con los filtros") : t("Esta categoría aún no tiene fichas")}
              descripcion={
                conFiltros
                  ? t("Quita algún filtro o prueba con otras palabras.")
                  : t("El catálogo sólo incluye fichas publicadas por fuentes oficiales en la fecha de consulta.")
              }
              accion={
                conFiltros ? (
                  <Button variante="secundario" onClick={limpiar}>
                    {t("Quitar filtros")}
                  </Button>
                ) : (
                  <ButtonLink to="/servicios" variante="secundario">
                    {t("Volver al catálogo")}
                  </ButtonLink>
                )
              }
            />
          ) : (
            <ListaServicios key={parametros.toString()} servicios={servicios.data} etiqueta={t("Servicios de {{categoria}}", { categoria: categoria.nombre })} />
          )}
        </section>
      </div>
    </>
  );
}
