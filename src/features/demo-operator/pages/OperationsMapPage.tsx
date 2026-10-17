import { Activity, ArrowLeft, ArrowUpRight, ChevronDown, ClipboardCheck, Hexagon, Layers, List, MapPin, Search, X } from "lucide-react";
import { useMemo, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate } from "react-router";
import { Button, Dialog } from "@/design-system";
import { dentroDeLimites } from "@/components/mapa/config";
import { areaValida, dentroDeArea, diagnosticoArea, resumenOperativo } from "@/domain/area-operativa";
import { CATEGORIAS_REPORTE } from "@/domain/reportes";
import { useActiveIdentity, useDemoSession } from "@/app/session/store";
import { useServices } from "@/services/hooks/catalog";
import { useReports } from "@/services/hooks/reports";
import type { CategoriaReporte, Coordenadas, EstadoMunicipal } from "@/types";
import { AreaDrawingControls } from "../components/AreaDrawingControls";
import { AreaReport } from "../components/AreaReport";
import { IncidentDetail } from "../components/IncidentDetail";
import { OperationalMap } from "../components/OperationalMap";
import { OperationsChat } from "../components/OperationsChat";
import { COLORES_TEMA, ETIQUETA_CATEGORIA_REPORTE, ICONO_REPORTE, TEMAS_OPERACION, TONO_REPORTE, serviciosDelTema } from "../lib/categorias";
import { ETIQUETAS_ESTADO } from "../lib/estados";
import { reducirTrazado, TRAZADO_INICIAL } from "../lib/trazado";
import "../operaciones.css";

export default function OperationsMapPage() {
  const { t } = useTranslation();
  const identidad = useActiveIdentity();
  const cambiar = useDemoSession((s) => s.cambiarIdentidad);
  const navegar = useNavigate();
  const consulta = useReports({}, true);
  const catalogo = useServices();
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState<CategoriaReporte | "">("");
  const [estado, setEstado] = useState<EstadoMunicipal | "">("");
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [listaAbierta, setListaAbierta] = useState(false);
  const [capasAbiertas, setCapasAbiertas] = useState(false);
  const [instruccion, setInstruccion] = useState(false);
  const [trazando, setTrazando] = useState(false);
  const [trazado, dispatchTrazo] = useReducer(reducirTrazado, TRAZADO_INICIAL);
  const borrador = trazado.vertices;
  const [area, setArea] = useState<Coordenadas[]>([]);
  const [reporteAbierto, setReporteAbierto] = useState(false);
  const [nombreAreaPersonalizado, setNombreAreaPersonalizado] = useState("");
  const nombreArea = nombreAreaPersonalizado || t("Mi área de análisis");
  const [coordenadas, setCoordenadas] = useState(false);
  const [entrada, setEntrada] = useState("");
  const [errorArea, setErrorArea] = useState("");
  const [tema, setTema] = useState<(typeof TEMAS_OPERACION)[number] | null>(null);

  const todos = useMemo(() => consulta.data ?? [], [consulta.data]);
  const filtrados = useMemo(
    () =>
      todos.filter(
        (reporte) =>
          (!categoria || reporte.categoria === categoria) &&
          (!estado || reporte.estadoMunicipal === estado) &&
          (!busqueda || `${reporte.folio} ${reporte.descripcion} ${reporte.ubicacion.colonia} ${reporte.ubicacion.referencia}`.toLowerCase().includes(busqueda.toLowerCase())),
      ),
    [todos, categoria, estado, busqueda],
  );
  const deArea = useMemo(() => (area.length ? filtrados.filter((reporte) => dentroDeArea(reporte.ubicacion, area)) : filtrados), [filtrados, area]);
  const resumen = resumenOperativo(deArea);
  const detalle = todos.find((reporte) => reporte.id === seleccionado);
  const casosBorrador = useMemo(() => (areaValida(borrador) ? filtrados.filter((reporte) => dentroDeArea(reporte.ubicacion, borrador)).length : 0), [borrador, filtrados]);

  const agregarPunto = (punto: Coordenadas) => {
    setErrorArea("");
    dispatchTrazo({ tipo: "agregar", punto });
  };

  const confirmarArea = () => {
    const error = diagnosticoArea(borrador);
    if (error) {
      setErrorArea(error);
      return;
    }
    setArea([...borrador]);
    setTrazando(false);
    setCoordenadas(false);
    setErrorArea("");
    setListaAbierta(false);
    setCapasAbiertas(false);
    setReporteAbierto(false);
  };

  const comenzarArea = (editar = false) => {
    setInstruccion(false);
    dispatchTrazo({ tipo: "iniciar", vertices: editar ? area : [] });
    setErrorArea("");
    setTrazando(true);
    setListaAbierta(false);
    setCapasAbiertas(false);
    setReporteAbierto(false);
  };

  const cancelarTrazo = () => {
    setTrazando(false);
    setErrorArea("");
    setCoordenadas(false);
  };

  if (identidad.rol === "ciudadania") return <Navigate to="/cuenta" replace />;

  return (
    <div className="op-workspace" data-trazando={trazando}>
      <div className="op-map-stage">
        <OperationalMap
          reportes={filtrados}
          vertices={trazando ? borrador : area}
          trazando={trazando}
          modoTrazo={trazado.modo}
          seleccionado={trazado.seleccionado}
          onSeleccionarVertice={(indice) => dispatchTrazo({ tipo: "seleccionar", indice })}
          onIniciarArrastre={(indice) => dispatchTrazo({ tipo: "empezar_arrastre", indice })}
          onMoverVertice={(indice, punto, provisional) => {
            setErrorArea("");
            dispatchTrazo({ tipo: "mover", indice, punto, provisional });
          }}
          onTerminarArrastre={(indice, punto) => dispatchTrazo({ tipo: "terminar_arrastre", indice, punto })}
          onCerrarArea={confirmarArea}
          onPunto={agregarPunto}
          onSeleccionar={setSeleccionado}
        />
      </div>

      <header className="op-header">
        <div className="op-brand">
          <img src="/brand/logo-merida-horizontal.svg" alt="Ayuntamiento de Mérida" />
          <span className="op-brand-divider" />
          <div>
            <p className="op-eyebrow">{t("Gobierno cercano")}</p>
            <h1>{t("Centro de operaciones")}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="op-demo-pill">
            <span /> {t("Datos de demostración")}
          </span>
          <button
            aria-label={t("Volver a vista ciudadana")}
            className="op-exit"
            onClick={() => {
              cambiar("ana");
              navegar("/");
            }}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>{t("Vista ciudadana")}</span>
          </button>
          <span className="op-avatar" title={identidad.nombre}>
            {identidad.iniciales}
          </span>
        </div>
      </header>

      {!trazando ? (
        <div className="op-topbar">
          <div className="op-place">
            <MapPin size={15} aria-hidden="true" />
            <strong>Mérida</strong>
            <span>Yucatán, México</span>
          </div>
          <div className="op-toolbar">
            <Link to="/operador/revision" aria-label={t("Revisión y verificaciones")} title={t("Revisión y verificaciones")} className="op-review-link">
              <ClipboardCheck size={16} aria-hidden="true" />
              <span>{t("Revisión")}</span>
            </Link>
            <button
              aria-pressed={listaAbierta}
              onClick={() => {
                setListaAbierta((v) => !v);
                setCapasAbiertas(false);
              }}
            >
              <List size={16} aria-hidden="true" />
              <span>{t("Incidencias")}</span>
              <b>{deArea.length}</b>
            </button>
            <button
              aria-label={t("Capas y servicios")}
              aria-pressed={capasAbiertas}
              onClick={() => {
                setCapasAbiertas((v) => !v);
                setListaAbierta(false);
              }}
            >
              <Layers size={16} aria-hidden="true" />
              <span>{t("Capas")}</span>
              <ChevronDown size={13} aria-hidden="true" />
            </button>
            <button aria-label={t("Trazar área")} onClick={() => setInstruccion(true)}>
              <Hexagon size={16} aria-hidden="true" />
              <span>{t("Área")}</span>
            </button>
          </div>
        </div>
      ) : null}

      {!trazando ? (
        <aside className="op-overview" aria-label={t("Resumen de operación")}>
          <p className="op-eyebrow">
            <Activity size={13} aria-hidden="true" /> {t("Pulso de la ciudad")}
          </p>
          <h2>
            {t("Una ciudad.")}
            <br />
            <em>{t("Todo a la vista.")}</em>
          </h2>
          <p className="op-overview-sub">
            {t("Entiende el territorio.")}
            <br />
            {t("Coordina la atención.")}
          </p>
          <div className="op-metrics">
            <div>
              <strong>{resumen.pendientes}</strong>
              <span>{t("por atender")}</span>
            </div>
            <div>
              <strong>{resumen.enProceso}</strong>
              <span>{t("en proceso")}</span>
            </div>
            <div>
              <strong>{resumen.solucionados}</strong>
              <span>{t("solucionadas")}</span>
            </div>
          </div>
          <div className="op-overview-bottom">
            <span className="op-live-dot" /> {t("Sincronización local · 15 s")}
          </div>
        </aside>
      ) : null}

      {consulta.isPending ? <div role="status" className="op-notice">{t("Cargando incidencias…")}</div> : null}
      {consulta.isError ? (
        <div role="alert" className="op-notice">
          <p>{consulta.error.message}</p>
          <Button onClick={() => void consulta.refetch()}>{t("Reintentar datos")}</Button>
        </div>
      ) : null}

      {!trazando && !area.length ? (
        <div className="op-legend" aria-label={t("Leyenda de incidencias")}>
          {CATEGORIAS_REPORTE.slice(0, 4).map((categoriaId) => (
            <button key={categoriaId} aria-pressed={categoria === categoriaId} onClick={() => setCategoria((v) => (v === categoriaId ? "" : categoriaId))}>
              <span className={`op-legend-dot ${COLORES_TEMA[TONO_REPORTE[categoriaId]]}`} />
              {categoriaId === "basura_via_publica" ? t("Residuos") : t(ETIQUETA_CATEGORIA_REPORTE[categoriaId])}
            </button>
          ))}
          <span className="op-legend-caption">{t("Incidencias simuladas")}</span>
        </div>
      ) : null}

      {listaAbierta || capasAbiertas ? (
        <aside className="op-side-panel" aria-label={listaAbierta ? t("Lista de incidencias") : t("Capas y servicios")}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{listaAbierta ? t("Incidencias") : t("Servicios en el territorio")}</h2>
            <button className="op-icon-button" aria-label={t("Cerrar panel")} onClick={() => { setListaAbierta(false); setCapasAbiertas(false); }}>
              <X size={18} />
            </button>
          </div>

          {listaAbierta ? (
            <>
              <p className="mt-1 text-xs text-tinta-suave">
                {area.length ? t("Área seleccionada") : t("Toda la ciudad")} · {t("{{n}} casos de demostración", { n: deArea.length })}
              </p>
              <label className="op-search">
                <Search size={16} aria-hidden="true" />
                <input
                  aria-label={t("Buscar incidencia, colonia o folio")}
                  placeholder={t("Colonia, folio o incidencia…")}
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </label>
              <div className="mb-4 grid grid-cols-2 gap-2">
                <select aria-label={t("Categoría de incidencia")} className="op-input" value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaReporte | "") }>
                  <option value="">{t("Todas las categorías")}</option>
                  {CATEGORIAS_REPORTE.map((categoriaId) => (
                    <option key={categoriaId} value={categoriaId}>
                      {t(ETIQUETA_CATEGORIA_REPORTE[categoriaId])}
                    </option>
                  ))}
                </select>
                <select aria-label={t("Estado municipal")} className="op-input" value={estado} onChange={(e) => setEstado(e.target.value as EstadoMunicipal | "") }>
                  <option value="">{t("Todos los estados")}</option>
                  {Object.entries(ETIQUETAS_ESTADO).map(([id, nombre]) => (
                    <option key={id} value={id}>
                      {t(nombre)}
                    </option>
                  ))}
                </select>
              </div>
              {categoria || estado || busqueda ? (
                <button className="mb-3 min-h-11 text-xs font-medium text-azul" onClick={() => { setCategoria(""); setEstado(""); setBusqueda(""); }}>
                  {t("Limpiar filtros")}
                </button>
              ) : null}
              {!deArea.length && !consulta.isPending ? <p className="p-4 text-sm text-tinta-suave">{t("No hay casos con estos filtros.")}</p> : null}
              <div className="space-y-2">
                {deArea.map((reporte) => (
                  <button key={reporte.id} onClick={() => setSeleccionado(reporte.id)} className="op-incident-card">
                    <span className={`op-category-icon ${COLORES_TEMA[TONO_REPORTE[reporte.categoria]]}`}>
                      <img src={`/brand/tramites/${ICONO_REPORTE[reporte.categoria]}.svg`} alt="" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong>{t(ETIQUETA_CATEGORIA_REPORTE[reporte.categoria])}</strong>
                      <small>{reporte.ubicacion.colonia ?? "Mérida"} · {reporte.folio}</small>
                      <span className="op-case-status">
                        {t(ETIQUETAS_ESTADO[reporte.estadoMunicipal])}
                        {reporte.riesgoDeclarado ? ` ${t("· Riesgo declarado")}` : ""}
                      </span>
                    </span>
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 mb-4 text-xs leading-relaxed text-tinta-suave">
                {t("Explora el catálogo por necesidad. Las ubicaciones de trámites y personas no se presuponen: el mapa sólo contiene incidencias de demostración.")}
              </p>
              <div className="op-theme-grid">
                {TEMAS_OPERACION.map((temaOperacion) => (
                  <button key={temaOperacion.id} className={COLORES_TEMA[temaOperacion.tono]} onClick={() => setTema(temaOperacion)}>
                    <img src={`/brand/tramites/${temaOperacion.icono}.svg`} alt="" />
                    <span>{t(temaOperacion.nombre)}</span>
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </button>
                ))}
              </div>
              <Link to="/servicios" className="mt-4 flex min-h-11 items-center justify-between text-sm font-semibold text-azul">
                {t("Ver catálogo completo")} <ArrowUpRight size={16} />
              </Link>
            </>
          )}
        </aside>
      ) : null}

      {area.length > 0 && !trazando && reporteAbierto && !listaAbierta && !capasAbiertas ? (
        <AreaReport
          vertices={area}
          reportes={deArea}
          nombre={nombreArea}
          onNombre={setNombreAreaPersonalizado}
          actualizado={consulta.dataUpdatedAt}
          onEditar={() => comenzarArea(true)}
          onCerrar={() => setReporteAbierto(false)}
          onSeleccionar={setSeleccionado}
        />
      ) : null}

      {area.length > 0 && !trazando && !reporteAbierto ? (
        <div className="op-area-selection">
          <span>
            <Hexagon size={16} aria-hidden="true" /> {t("Área seleccionada · {{n}} incidencias", { n: deArea.length })}
          </span>
          <button onClick={() => { setReporteAbierto(true); setListaAbierta(false); setCapasAbiertas(false); }}>{t("Ver reporte")}</button>
          <button aria-label={t("Editar área seleccionada")} onClick={() => comenzarArea(true)}>{t("Editar")}</button>
          <button className="op-icon-button" aria-label={t("Quitar área seleccionada")} onClick={() => { setArea([]); setReporteAbierto(false); setNombreAreaPersonalizado(""); }}>
            <X size={16} />
          </button>
        </div>
      ) : null}

      {trazando ? (
        <AreaDrawingControls
          trazado={trazado}
          casos={casosBorrador}
          error={errorArea}
          bloquearAtajos={coordenadas}
          onModo={(modo) => dispatchTrazo({ tipo: "modo", modo })}
          onDeshacer={() => { setErrorArea(""); dispatchTrazo({ tipo: "deshacer" }); }}
          onReiniciar={() => { setErrorArea(""); dispatchTrazo({ tipo: "reiniciar" }); }}
          onEliminar={() => { setErrorArea(""); dispatchTrazo({ tipo: "eliminar" }); }}
          onConfirmar={confirmarArea}
          onCancelar={cancelarTrazo}
          onManual={() => {
            setEntrada(borrador.map((p) => `${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`).join("\n"));
            setCoordenadas(true);
          }}
        />
      ) : (
        <OperationsChat reportes={deArea} enArea={area.length > 0} onArea={() => setInstruccion(true)} onSeleccionar={setSeleccionado} onFiltrar={setBusqueda} />
      )}

      {detalle ? <IncidentDetail key={detalle.id} reporte={detalle} onCerrar={() => setSeleccionado(null)} /> : null}

      <Dialog
        abierto={instruccion}
        onCerrar={() => setInstruccion(false)}
        titulo={t("Una nueva forma de leer la ciudad")}
        descripcion={t("Traza un área para conocer qué pasa en una colonia, una manzana o la zona que necesites.")}
        acciones={<Button onClick={() => comenzarArea()}>{t("Empezar a trazar")} <ArrowUpRight size={16} /></Button>}
      >
        <div className="op-draw-preview" aria-hidden="true">
          <svg viewBox="0 0 360 160">
            <path d="M0 40H360M0 80H360M0 120H360M60 0V160M120 0V160M180 0V160M240 0V160M300 0V160" className="op-grid-lines" />
            <polygon points="100,120 145,30 285,105" />
            <circle cx="100" cy="120" r="6" />
            <circle cx="145" cy="30" r="6" />
            <circle cx="285" cy="105" r="6" />
          </svg>
        </div>
        <ol className="my-4 space-y-2 text-sm text-tinta-suave">
          <li>{t("1. Coloca tres o más puntos en el mapa.")}</li>
          <li>{t("2. Arrastra los puntos para corregir y toca el punto 1 para cerrar.")}</li>
          <li>{t("3. Usa Mover mapa para desplazarte y Ver reporte para consultar los casos.")}</li>
        </ol>
        <p className="mb-3 text-xs text-tinta-suave">
          {t("El reporte usa datos ficticios y se actualiza con las acciones de esta demo. El área no representa un límite catastral oficial.")}
        </p>
      </Dialog>

      <Dialog
        abierto={coordenadas}
        onCerrar={() => setCoordenadas(false)}
        titulo={t("Agregar puntos por coordenadas")}
        descripcion={t("Un punto por línea: latitud, longitud. Deben estar dentro del municipio y sus alrededores.")}
        acciones={
          <Button
            onClick={() => {
              const puntos = entrada
                .trim()
                .split(/\n/)
                .map((linea) => linea.split(",").map(Number))
                .map(([lat, lng]) => ({ lat: lat ?? Number.NaN, lng: lng ?? Number.NaN }));
              if (!puntos.every((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && dentroDeLimites(p)) || !areaValida(puntos)) {
                setErrorArea(t("Revisa las coordenadas. Necesitas un polígono válido de al menos tres puntos en Mérida."));
                return;
              }
              dispatchTrazo({ tipo: "reemplazar", vertices: puntos });
              setErrorArea("");
              setCoordenadas(false);
            }}
          >
            {t("Usar estos puntos")}
          </Button>
        }
      >
        <label className="block text-sm font-medium">
          {t("Vértices")}
          <textarea className="op-input mt-2 min-h-40" value={entrada} onChange={(e) => setEntrada(e.target.value)} placeholder={"20.95, -89.65\n21.00, -89.65\n21.00, -89.60\n20.95, -89.60"} />
        </label>
        {errorArea ? <p role="alert" className="my-2 text-sm text-peligro">{errorArea}</p> : null}
      </Dialog>

      <Dialog
        abierto={tema !== null}
        onCerrar={() => setTema(null)}
        titulo={tema ? t(tema.nombre) : t("Servicios")}
        descripcion={t("Referencias del catálogo municipal. Información de la fuente y estado de integración en cada ficha.")}
      >
        <div className="space-y-2 pb-4">
          {catalogo.isPending ? <p role="status">{t("Cargando catálogo…")}</p> : null}
          {catalogo.isError ? <p role="alert">{t("No se pudo cargar el catálogo.")}</p> : null}
          {!catalogo.isPending && !catalogo.isError
            ? serviciosDelTema(catalogo.data ?? [], tema?.id ?? "").map((servicio) => (
                <Link key={servicio.id} to={servicio.rutaInterna} className="flex min-h-12 items-center justify-between gap-3 rounded-control border border-borde p-3 text-sm hover:bg-fondo">
                  {servicio.nombre}
                  <ArrowUpRight size={16} className="shrink-0" />
                </Link>
              ))
            : null}
        </div>
      </Dialog>
    </div>
  );
}
