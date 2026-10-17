import { AreaDrawingControls } from "../components/AreaDrawingControls";
import { reducirTrazado, TRAZADO_INICIAL } from "../lib/trazado";
import { ETIQUETAS_ESTADO } from "../lib/estados";
import { useMemo, useReducer, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { Activity, ArrowLeft, ArrowUpRight, ChevronDown, Hexagon, Layers, List, MapPin, Search, X } from "lucide-react";
import { useActiveIdentity, useDemoSession } from "@/app/session/store";
import { useReports } from "@/services/hooks/reports";
import { useServices } from "@/services/hooks/catalog";
import { Button, Dialog } from "@/design-system";
import { CATEGORIAS_REPORTE, NOMBRE_CATEGORIA_REPORTE } from "@/domain/reportes";
import { areaValida, diagnosticoArea, dentroDeArea, resumenOperativo } from "@/domain/area-operativa";
import { dentroDeLimites } from "@/components/mapa/config";
import type { Coordenadas, CategoriaReporte, EstadoMunicipal } from "@/types";
import { OperationalMap } from "../components/OperationalMap";
import { IncidentDetail } from "../components/IncidentDetail";
import { AreaReport } from "../components/AreaReport";
import { OperationsChat } from "../components/OperationsChat";
import { COLORES_TEMA, ICONO_REPORTE, TEMAS_OPERACION, TONO_REPORTE, serviciosDelTema } from "../lib/categorias";
import "../operaciones.css";

export default function OperatorPage() {
  const identidad = useActiveIdentity(); const cambiar = useDemoSession(s => s.cambiarIdentidad); const navegar = useNavigate();
  const consulta = useReports({}, true); const catalogo = useServices();
  const [busqueda, setBusqueda] = useState(""); const [categoria, setCategoria] = useState<CategoriaReporte | "">("");
  const [estado, setEstado] = useState<EstadoMunicipal | "">("");
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [listaAbierta, setListaAbierta] = useState(false); const [capasAbiertas, setCapasAbiertas] = useState(false);
  const [instruccion, setInstruccion] = useState(false); const [trazando, setTrazando] = useState(false);
  const [trazado, dispatchTrazo] = useReducer(reducirTrazado, TRAZADO_INICIAL);
  const borrador = trazado.vertices;
  const [area, setArea] = useState<Coordenadas[]>([]);
  const [reporteAbierto, setReporteAbierto] = useState(false);
  const [nombreArea, setNombreArea] = useState("Mi área de análisis");
  const [coordenadas, setCoordenadas] = useState(false); const [entrada, setEntrada] = useState(""); const [errorArea, setErrorArea] = useState("");
  const [tema, setTema] = useState<(typeof TEMAS_OPERACION)[number] | null>(null);
  const todos = useMemo(() => consulta.data ?? [], [consulta.data]);
  const filtrados = useMemo(() => todos.filter(r => (!categoria || r.categoria === categoria) && (!estado || r.estadoMunicipal === estado) && (!busqueda || `${r.folio} ${r.descripcion} ${r.ubicacion.colonia} ${r.ubicacion.referencia}`.toLowerCase().includes(busqueda.toLowerCase()))), [todos, categoria, estado, busqueda]);
  const deArea = useMemo(() => area.length ? filtrados.filter(r => dentroDeArea(r.ubicacion, area)) : filtrados, [filtrados, area]);
  const resumen = resumenOperativo(deArea);
  const detalle = todos.find(r => r.id === seleccionado);
  const casosBorrador = useMemo(() => areaValida(borrador) ? filtrados.filter(r => dentroDeArea(r.ubicacion, borrador)).length : 0, [borrador, filtrados]);
  const agregarPunto = (punto: Coordenadas) => { setErrorArea(""); dispatchTrazo({ tipo: "agregar", punto }); };
  const confirmarArea = () => {
    const error = diagnosticoArea(borrador);
    if (error) { setErrorArea(error); return; }
    setArea([...borrador]); setTrazando(false); setCoordenadas(false); setErrorArea(""); setListaAbierta(false); setCapasAbiertas(false); setReporteAbierto(false);
  };
  const comenzarArea = (editar = false) => {
    setInstruccion(false); dispatchTrazo({ tipo: "iniciar", vertices: editar ? area : [] });
    setErrorArea(""); setTrazando(true); setListaAbierta(false); setCapasAbiertas(false); setReporteAbierto(false);
  };
  const cancelarTrazo = () => { setTrazando(false); setErrorArea(""); setCoordenadas(false); };
  if (identidad.rol === "ciudadania") return <Navigate to="/cuenta" replace />;
  return <div className="op-workspace" data-trazando={trazando}>
    <div className="op-map-stage"><OperationalMap reportes={filtrados} vertices={trazando ? borrador : area} trazando={trazando} modoTrazo={trazado.modo} seleccionado={trazado.seleccionado}
      onSeleccionarVertice={indice => dispatchTrazo({ tipo: "seleccionar", indice })}
      onIniciarArrastre={indice => dispatchTrazo({ tipo: "empezar_arrastre", indice })}
      onMoverVertice={(indice, punto, provisional) => { setErrorArea(""); dispatchTrazo({ tipo: "mover", indice, punto, provisional }); }}
      onTerminarArrastre={(indice, punto) => dispatchTrazo({ tipo: "terminar_arrastre", indice, punto })}
      onCerrarArea={confirmarArea} onPunto={agregarPunto} onSeleccionar={setSeleccionado} /></div>
    <header className="op-header">
      <div className="op-brand"><img src="/brand/ayuntamiento-merida-horizontal.svg" alt="Ayuntamiento de Mérida" /><span className="op-brand-divider" /><div><p className="op-eyebrow">Gobierno cercano</p><h1>Centro de operaciones</h1></div></div>
      <div className="flex items-center gap-2"><span className="op-demo-pill"><span /> Datos de demostración</span><button aria-label="Volver a vista ciudadana" className="op-exit" onClick={() => { cambiar("ana"); navegar("/"); }}><ArrowLeft size={16} aria-hidden="true" /><span>Vista ciudadana</span></button><span className="op-avatar" title={identidad.nombre}>{identidad.iniciales}</span></div>
    </header>
    {!trazando && <div className="op-topbar"><div className="op-place"><MapPin size={15} aria-hidden="true" /><strong>Mérida</strong><span>Yucatán, México</span></div><div className="op-toolbar"><button aria-pressed={listaAbierta} onClick={() => { setListaAbierta(v => !v); setCapasAbiertas(false); }}><List size={16} aria-hidden="true" /><span>Incidencias</span><b>{deArea.length}</b></button><button aria-label="Capas y servicios" aria-pressed={capasAbiertas} onClick={() => { setCapasAbiertas(v => !v); setListaAbierta(false); }}><Layers size={16} aria-hidden="true" /><span>Capas</span><ChevronDown size={13} aria-hidden="true" /></button><button aria-label="Trazar área" onClick={() => setInstruccion(true)}><Hexagon size={16} aria-hidden="true" /><span>Área</span></button></div></div>}
    {!trazando && <aside className="op-overview" aria-label="Resumen de operación"><p className="op-eyebrow"><Activity size={13} aria-hidden="true" /> Pulso de la ciudad</p><h2>Una ciudad.<br /><em>Todo a la vista.</em></h2><p className="op-overview-sub">Entiende el territorio.<br />Coordina la atención.</p><div className="op-metrics"><div><strong>{resumen.pendientes}</strong><span>por atender</span></div><div><strong>{resumen.enProceso}</strong><span>en proceso</span></div><div><strong>{resumen.solucionados}</strong><span>solucionadas</span></div></div><div className="op-overview-bottom"><span className="op-live-dot" /> Sincronización local · 15 s</div></aside>}
    {consulta.isPending && <div role="status" className="op-notice">Cargando incidencias…</div>}
    {consulta.isError && <div role="alert" className="op-notice"><p>{consulta.error.message}</p><Button onClick={() => void consulta.refetch()}>Reintentar datos</Button></div>}
    {!trazando && !area.length && <div className="op-legend" aria-label="Leyenda de incidencias">{CATEGORIAS_REPORTE.slice(0, 4).map(c => <button key={c} aria-pressed={categoria === c} onClick={() => setCategoria(v => v === c ? "" : c)}><span className={`op-legend-dot ${COLORES_TEMA[TONO_REPORTE[c]]}`} />{c === "basura_via_publica" ? "Residuos" : NOMBRE_CATEGORIA_REPORTE[c]}</button>)}<span className="op-legend-caption">Incidencias simuladas</span></div>}
    {(listaAbierta || capasAbiertas) && <aside className="op-side-panel" aria-label={listaAbierta ? "Lista de incidencias" : "Capas y servicios"}><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{listaAbierta ? "Incidencias" : "Servicios en el territorio"}</h2><button className="op-icon-button" aria-label="Cerrar panel" onClick={() => { setListaAbierta(false); setCapasAbiertas(false); }}><X size={18} /></button></div>
      {listaAbierta ? <><p className="mt-1 text-xs text-tinta-suave">{area.length ? "Área seleccionada" : "Toda la ciudad"} · {deArea.length} casos de demostración</p><label className="op-search"><Search size={16} aria-hidden="true" /><input aria-label="Buscar incidencia, colonia o folio" placeholder="Colonia, folio o incidencia…" value={busqueda} onChange={e => setBusqueda(e.target.value)} /></label><div className="mb-4 grid grid-cols-2 gap-2"><select aria-label="Categoría de incidencia" className="op-input" value={categoria} onChange={e => setCategoria(e.target.value as CategoriaReporte | "")}><option value="">Todas las categorías</option>{CATEGORIAS_REPORTE.map(c => <option key={c} value={c}>{NOMBRE_CATEGORIA_REPORTE[c]}</option>)}</select><select aria-label="Estado municipal" className="op-input" value={estado} onChange={e => setEstado(e.target.value as EstadoMunicipal | "")}><option value="">Todos los estados</option>{Object.entries(ETIQUETAS_ESTADO).map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}</select></div>
      {(categoria || estado || busqueda) && <button className="mb-3 min-h-11 text-xs font-medium text-azul" onClick={() => { setCategoria(""); setEstado(""); setBusqueda(""); }}>Limpiar filtros</button>}
      {!deArea.length && !consulta.isPending && <p className="p-4 text-sm text-tinta-suave">No hay casos con estos filtros.</p>}
      <div className="space-y-2">{deArea.map(r => <button key={r.id} onClick={() => setSeleccionado(r.id)} className="op-incident-card"><span className={`op-category-icon ${COLORES_TEMA[TONO_REPORTE[r.categoria]]}`}><img src={`/brand/tramites/${ICONO_REPORTE[r.categoria]}.svg`} alt="" /></span><span className="min-w-0 flex-1"><strong>{NOMBRE_CATEGORIA_REPORTE[r.categoria]}</strong><small>{r.ubicacion.colonia ?? "Mérida"} · {r.folio}</small><span className="op-case-status">{ETIQUETAS_ESTADO[r.estadoMunicipal]} {r.riesgoDeclarado ? "· Riesgo declarado" : ""}</span></span><ArrowUpRight size={16} aria-hidden="true" /></button>)}</div></> : <><p className="mt-2 mb-4 text-xs leading-relaxed text-tinta-suave">Explora el catálogo por necesidad. Las ubicaciones de trámites y personas no se presuponen: el mapa sólo contiene incidencias de demostración.</p><div className="op-theme-grid">{TEMAS_OPERACION.map(t => <button key={t.id} className={COLORES_TEMA[t.tono]} onClick={() => setTema(t)}><img src={`/brand/tramites/${t.icono}.svg`} alt="" /><span>{t.nombre}</span><ArrowUpRight size={14} aria-hidden="true" /></button>)}</div><Link to="/servicios" className="mt-4 flex min-h-11 items-center justify-between text-sm font-semibold text-azul">Ver catálogo completo <ArrowUpRight size={16} /></Link></>}
    </aside>}
    {area.length > 0 && !trazando && reporteAbierto && !listaAbierta && !capasAbiertas && <AreaReport vertices={area} reportes={deArea} nombre={nombreArea} onNombre={setNombreArea} actualizado={consulta.dataUpdatedAt} onEditar={() => comenzarArea(true)} onCerrar={() => setReporteAbierto(false)} onSeleccionar={setSeleccionado} />}
    {area.length > 0 && !trazando && !reporteAbierto && <div className="op-area-selection"><span><Hexagon size={16} aria-hidden="true" /> Área seleccionada · {deArea.length} incidencias</span><button onClick={() => { setReporteAbierto(true); setListaAbierta(false); setCapasAbiertas(false); }}>Ver reporte</button><button aria-label="Editar área seleccionada" onClick={() => comenzarArea(true)}>Editar</button><button className="op-icon-button" aria-label="Quitar área seleccionada" onClick={() => { setArea([]); setReporteAbierto(false); }}><X size={16} /></button></div>}
    {trazando ? <AreaDrawingControls trazado={trazado} casos={casosBorrador} error={errorArea} bloquearAtajos={coordenadas}
      onModo={modo => dispatchTrazo({ tipo: "modo", modo })}
      onDeshacer={() => { setErrorArea(""); dispatchTrazo({ tipo: "deshacer" }); }}
      onReiniciar={() => { setErrorArea(""); dispatchTrazo({ tipo: "reiniciar" }); }}
      onEliminar={() => { setErrorArea(""); dispatchTrazo({ tipo: "eliminar" }); }}
      onConfirmar={confirmarArea} onCancelar={cancelarTrazo}
      onManual={() => { setEntrada(borrador.map(p => `${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`).join("\n")); setCoordenadas(true); }} /> : <OperationsChat reportes={deArea} enArea={area.length > 0} onArea={() => setInstruccion(true)} onSeleccionar={setSeleccionado} onFiltrar={setBusqueda} />}
    {detalle && <IncidentDetail key={detalle.id} reporte={detalle} onCerrar={() => setSeleccionado(null)} />}
    <Dialog abierto={instruccion} onCerrar={() => setInstruccion(false)} titulo="Una nueva forma de leer la ciudad" descripcion="Traza un área para conocer qué pasa en una colonia, una manzana o la zona que necesites." acciones={<Button onClick={() => comenzarArea()}>Empezar a trazar <ArrowUpRight size={16} /></Button>}>
      <div className="op-draw-preview" aria-hidden="true"><svg viewBox="0 0 360 160"><path d="M0 40H360M0 80H360M0 120H360M60 0V160M120 0V160M180 0V160M240 0V160M300 0V160" className="op-grid-lines" /><polygon points="100,120 145,30 285,105" /><circle cx="100" cy="120" r="6" /><circle cx="145" cy="30" r="6" /><circle cx="285" cy="105" r="6" /></svg></div><ol className="my-4 space-y-2 text-sm text-tinta-suave"><li>1. Coloca tres o más puntos en el mapa.</li><li>2. Arrastra los puntos para corregir y toca el punto 1 para cerrar.</li><li>3. Usa Mover mapa para desplazarte y Ver reporte para consultar los casos.</li></ol><p className="mb-3 text-xs text-tinta-suave">El reporte usa datos ficticios y se actualiza con las acciones de esta demo. El área no representa un límite catastral oficial.</p>
    </Dialog>
    <Dialog abierto={coordenadas} onCerrar={() => setCoordenadas(false)} titulo="Agregar puntos por coordenadas" descripcion="Un punto por línea: latitud, longitud. Deben estar dentro del municipio y sus alrededores." acciones={<Button onClick={() => {
      const puntos = entrada.trim().split(/\n/).map(linea => linea.split(",").map(Number)).map(([lat, lng]) => ({ lat: lat ?? NaN, lng: lng ?? NaN }));
      if (!puntos.every(p => Number.isFinite(p.lat) && Number.isFinite(p.lng) && dentroDeLimites(p)) || !areaValida(puntos)) { setErrorArea("Revisa las coordenadas. Necesitas un polígono válido de al menos tres puntos en Mérida."); return; }
      dispatchTrazo({ tipo: "reemplazar", vertices: puntos }); setErrorArea(""); setCoordenadas(false);
    }}>Usar estos puntos</Button>}><label className="block text-sm font-medium">Vértices<textarea className="op-input mt-2 min-h-40" value={entrada} onChange={e => setEntrada(e.target.value)} placeholder={'20.95, -89.65\n21.00, -89.65\n21.00, -89.60\n20.95, -89.60'} /></label>{errorArea && <p role="alert" className="my-2 text-sm text-peligro">{errorArea}</p>}</Dialog>
    <Dialog abierto={tema !== null} onCerrar={() => setTema(null)} titulo={tema?.nombre ?? "Servicios"} descripcion="Referencias del catálogo municipal. Información de la fuente y estado de integración en cada ficha."><div className="space-y-2 pb-4">{catalogo.isPending ? <p role="status">Cargando catálogo…</p> : catalogo.isError ? <p role="alert">No se pudo cargar el catálogo.</p> : serviciosDelTema(catalogo.data ?? [], tema?.id ?? "").map(s => <Link key={s.id} to={s.rutaInterna} className="flex min-h-12 items-center justify-between gap-3 rounded-control border border-borde p-3 text-sm hover:bg-fondo">{s.nombre}<ArrowUpRight size={16} className="shrink-0" /></Link>)}</div></Dialog>
  </div>;
}
