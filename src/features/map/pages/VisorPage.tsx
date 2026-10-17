import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useActiveIdentity } from "@/app/session/store";
import type { EstadoCargaMapa } from "@/components/mapa/tipos";
import { Button, DemoTag, ErrorState, IntegrationBadge, PageHeader, Sheet } from "@/design-system";
import { useAggregatedDemand, useReports, useServiceLocations } from "@/services/hooks";
import type { Coordenadas, Reporte } from "@/types";
import { puedeVerCapa } from "../catalogo-capas";
import { filtrosActivos } from "../estado-url";
import { contarPorCategoria, contarPorEstado, filtrarIncidencias, incidenciasEnCelda, separarUbicaciones } from "../incidencias";
import { AvisoAsistente } from "../components/AvisoAsistente";
import { BarraVisor } from "../components/BarraVisor";
import { DemandaBienestar } from "../components/DemandaBienestar";
import { LeyendaCapas } from "../components/LeyendaCapas";
import { ListaIncidencias } from "../components/ListaIncidencias";
import { MapaVisor } from "../components/MapaVisor";
import { PanelFiltros } from "../components/PanelFiltros";
import { PanelIncidencia } from "../components/PanelIncidencia";
import { PanelZona, type ZonaSeleccionada } from "../components/PanelZona";
import { ResumenFiltros } from "../components/ResumenFiltros";
import { UbicacionesAtencion } from "../components/UbicacionesAtencion";
import { useConsultaMedios } from "../hooks/useConsultaMedios";
import { useEstadoVisor } from "../hooks/useEstadoVisor";

/**
 * Mapa / Visor Urbano del prototipo (recorrido H). Una funcionalidad más de la app, no su centro:
 * incidencias de demostración (puntos, calor o zonas H3), ubicaciones de atención verificadas,
 * explicación de la información territorial oficial (sin acceso autorizado) y, sólo para operación,
 * demanda de bienestar agregada. Vista, representación y filtros viven en la URL.
 */
export default function VisorPage() {
  const navigate = useNavigate();
  const actor = useActiveIdentity();
  const { estado, actualizar } = useEstadoVisor();
  const esEscritorio = useConsultaMedios("(min-width: 64rem)");
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [estadoMapa, setEstadoMapa] = useState<EstadoCargaMapa>("cargando");
  const [zona, setZona] = useState<{ h3: string; resolucion: number } | null>(null);
  const detallePendiente = useRef<string | null>(null);

  const reportes = useReports();
  const ubicaciones = useServiceLocations();
  const veBienestar = puedeVerCapa("demanda_bienestar_agregada", actor.rol);
  const demanda = useAggregatedDemand();

  const todas = useMemo(() => reportes.data ?? [], [reportes.data]);
  const visibles = useMemo(() => filtrarIncidencias(todas, estado), [todas, estado]);
  const conteoCategorias = useMemo(() => contarPorCategoria(todas, estado.estados), [todas, estado.estados]);
  const conteoEstados = useMemo(() => contarPorEstado(todas, estado.categorias), [todas, estado.categorias]);
  const sedes = useMemo(() => separarUbicaciones(ubicaciones.data ?? []), [ubicaciones.data]);
  const numeroFiltros = filtrosActivos(estado);

  const reporteAbierto: Reporte | null = useMemo(
    () => (estado.reporteId ? (todas.find((reporte) => reporte.id === estado.reporteId) ?? null) : null),
    [todas, estado.reporteId],
  );
  // Si la URL trae una incidencia (p. ej. desde el asistente), la cámara se centra en ella.
  const centrarEn: Coordenadas | null = useMemo(
    () => (reporteAbierto ? { lat: reporteAbierto.ubicacion.lat, lng: reporteAbierto.ubicacion.lng } : null),
    [reporteAbierto],
  );

  const zonaSeleccionada: ZonaSeleccionada | null = useMemo(
    () => (zona ? { ...zona, incidencias: incidenciasEnCelda(visibles, zona.h3, zona.resolucion) } : null),
    [zona, visibles],
  );

  // «Ver detalle»: primero se cierra el panel (se reemplaza la URL) y luego se abre el detalle, así al
  // regresar el mapa conserva vista y filtros sin volver a abrir el panel.
  useEffect(() => {
    const id = detallePendiente.current;
    if (id && estado.reporteId === null) {
      detallePendiente.current = null;
      navigate(`/reportes/${encodeURIComponent(id)}`);
    }
  }, [estado.reporteId, navigate]);

  const limpiarFiltros = useCallback(() => actualizar({ categorias: [], estados: [] }), [actualizar]);
  const alEstadoMapa = useCallback((nuevo: EstadoCargaMapa) => setEstadoMapa(nuevo), []);

  const panelFiltros = (
    <PanelFiltros
      categorias={estado.categorias}
      estados={estado.estados}
      conteoCategorias={conteoCategorias}
      conteoEstados={conteoEstados}
      onCambiar={actualizar}
    />
  );

  const leyenda = (
    <LeyendaCapas
      rol={actor.rol}
      vista={estado.vista}
      representacion={estado.capa}
      resolucion={estado.resolucion}
      onResolucion={(resolucion) => actualizar({ resolucion })}
      sedes={ubicaciones.data ? { conCoordenadas: sedes.conCoordenadas.length, sinCoordenadas: sedes.sinCoordenadas.length } : undefined}
      bienestar={
        veBienestar ? (
          <DemandaBienestar
            datos={demanda.data}
            cargando={demanda.isPending}
            error={demanda.error}
            onReintentar={() => void demanda.refetch()}
            activa={estado.bienestar}
            onActivar={(bienestar) => actualizar({ bienestar })}
          />
        ) : undefined
      }
    />
  );

  const lista = (titulo?: string) => (
    <ListaIncidencias
      key={`${estado.categorias.join(",")}|${estado.estados.join(",")}`}
      reportes={reportes.data ? visibles : undefined}
      cargando={reportes.isPending}
      error={reportes.error}
      onReintentar={() => void reportes.refetch()}
      hayFiltros={numeroFiltros > 0}
      onLimpiarFiltros={limpiarFiltros}
      titulo={titulo}
    />
  );

  return (
    <>
      <PageHeader
        titulo="Mapa / Visor Urbano"
        descripcion="Incidencias de demostración, zonas con más reportes y ubicaciones de atención. No sustituye al Visor Urbano oficial del Ayuntamiento."
      >
        <div className="flex flex-wrap items-center gap-2">
          <DemoTag>Datos de demostración</DemoTag>
          <IntegrationBadge estado="simulada" />
        </div>
      </PageHeader>

      <AvisoAsistente />

      <div className="space-y-3">
        <BarraVisor
          vista={estado.vista}
          capa={estado.capa}
          onVista={(vista) => actualizar({ vista })}
          onCapa={(capa) => actualizar({ capa })}
          onAbrirFiltros={esEscritorio ? undefined : () => setFiltrosAbiertos(true)}
          filtrosActivos={numeroFiltros}
        />
        <ResumenFiltros
          categorias={estado.categorias}
          estados={estado.estados}
          visibles={reportes.data ? visibles.length : undefined}
          total={reportes.data ? todas.length : undefined}
          sinDatos={reportes.isError}
          onQuitarCategoria={(categoria) => actualizar({ categorias: estado.categorias.filter((c) => c !== categoria) })}
          onQuitarEstado={(valor) => actualizar({ estados: estado.estados.filter((e) => e !== valor) })}
          onLimpiar={limpiarFiltros}
        />
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
        {esEscritorio ? (
          <aside aria-labelledby="titulo-filtros" className="space-y-6">
            <section className="rounded-tarjeta border border-borde bg-superficie p-4">
              <h2 id="titulo-filtros" className="mb-3 text-lg font-semibold text-marino">
                Filtrar incidencias
              </h2>
              {panelFiltros}
            </section>
            {leyenda}
          </aside>
        ) : null}

        <div className="min-w-0 space-y-6">
          {estado.vista === "mapa" ? (
            <>
              {reportes.isError && !reportes.data ? (
                <ErrorState
                  error={reportes.error}
                  titulo="No se pudieron cargar las incidencias"
                  onReintentar={() => void reportes.refetch()}
                />
              ) : null}
              <MapaVisor
                incidencias={visibles}
                representacion={estado.capa}
                resolucion={estado.resolucion}
                bienestar={veBienestar && estado.bienestar ? (demanda.data ?? null) : null}
                sedes={sedes.conCoordenadas}
                centrarEn={centrarEn}
                onSeleccionarReporte={(reporteId) => actualizar({ reporteId })}
                onSeleccionarZona={(h3) => setZona({ h3, resolucion: estado.resolucion })}
                onEstado={alEstadoMapa}
                onVerLista={() => actualizar({ vista: "lista" })}
              />
              {/* Si el mapa no carga, la lista aparece aquí mismo: nada depende del mapa. */}
              {estadoMapa === "fallido" ? lista("Incidencias de demostración (lista)") : null}
            </>
          ) : (
            lista()
          )}
          {esEscritorio ? null : leyenda}
        </div>
      </div>

      <div className="mt-8">
        <UbicacionesAtencion />
      </div>

      {esEscritorio ? null : (
        <Sheet
          abierto={filtrosAbiertos}
          onCerrar={() => setFiltrosAbiertos(false)}
          titulo="Filtrar incidencias"
          descripcion="Los filtros se aplican al momento y se conservan al volver de un detalle."
          pie={
            <div className="flex flex-wrap gap-3">
              <Button className="flex-1" onClick={() => setFiltrosAbiertos(false)}>
                {reportes.data ? `Ver ${visibles.length} incidencias` : "Listo"}
              </Button>
              {numeroFiltros > 0 ? (
                <Button variante="secundario" onClick={limpiarFiltros}>
                  Limpiar
                </Button>
              ) : null}
            </div>
          }
        >
          {panelFiltros}
        </Sheet>
      )}

      <PanelIncidencia
        reporte={reporteAbierto}
        onCerrar={() => actualizar({ reporteId: null })}
        onVerDetalle={(reporte) => {
          detallePendiente.current = reporte.id;
          actualizar({ reporteId: null });
        }}
      />
      <PanelZona zona={zonaSeleccionada} onCerrar={() => setZona(null)} />
    </>
  );
}
