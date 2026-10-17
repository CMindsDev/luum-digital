import { consultarIncidencias, normalizarConsulta } from "@/domain/consulta-operativa";
import { useState } from "react";
import { ArrowUpRight, Hexagon, Sparkles, X, Search, ChartNoAxesCombined } from "lucide-react";
import { Link } from "react-router";
import { AssistantComposer } from "@/components/ui/assistant-composer";
import { useCatalogSearch } from "@/services/hooks/catalog";
import { resumenOperativo } from "@/domain/area-operativa";
import { NOMBRE_CATEGORIA_REPORTE } from "@/domain/reportes";
import type { Reporte } from "@/types";



export function OperationsChat({ reportes, enArea, onArea, onSeleccionar, onFiltrar }: {
  reportes: Reporte[]; enArea: boolean; onArea: () => void; onSeleccionar: (id: string) => void; onFiltrar: (s: string) => void;
}) {
  const [mas, setMas] = useState(false); const [pregunta, setPregunta] = useState(""); const [visible, setVisible] = useState(false);
  const [modo, setModo] = useState("auto");
  const catalogo = useCatalogSearch(pregunta);
  const consulta = normalizarConsulta(pregunta);
  const coincidencias = consultarIncidencias(reportes, pregunta);
  const resumen = resumenOperativo(coincidencias);
  const esConsultaCasos = modo !== "catalogo" && /inciden|reporte|bache|riesgo|urgente|asignar|pendiente|luminaria|alumbrado|basura|rejilla|parque|jardin|cancelad|proceso|solucion|resuelt|resumen|pasando/.test(consulta);
  const enviar = ({ text }: { text: string }) => { setPregunta(text); setVisible(true); setMas(false); };
  return <div className="op-chat-wrap">
    {visible && <section className="op-chat-answer" aria-label="Respuesta del asistente"><div className="flex items-center justify-between"><span className="op-eyebrow"><Sparkles size={14} aria-hidden="true" /> Asistente de operación · Consulta local</span><button aria-label="Cerrar conversación" className="op-icon-button" onClick={() => setVisible(false)}><X size={17} /></button></div><p className="my-3 text-sm font-semibold">{pregunta}</p>
      <div aria-live="polite" className="text-sm leading-relaxed">
        {esConsultaCasos ? <><p>{enArea ? "En el área seleccionada" : "En la vista actual"} según tu consulta: <strong>{resumen.total} incidencias</strong>; {resumen.pendientes} registradas, {resumen.enProceso} en proceso; {resumen.solucionados} solucionadas y {resumen.cancelados} canceladas. {resumen.riesgos} casos abiertos tienen riesgo declarado y {resumen.sinAsignar} siguen sin equipo.</p><div className="mt-3 space-y-1">{coincidencias.slice(0, 3).map(r => <button key={r.id} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-control bg-fondo px-3 text-left text-xs" onClick={() => onSeleccionar(r.id)}><span>{NOMBRE_CATEGORIA_REPORTE[r.categoria]} · {r.ubicacion.colonia}</span><ArrowUpRight size={14} aria-hidden="true" /></button>)}</div></> : <p>{catalogo.isFetching ? "Consultando el catálogo municipal…" : catalogo.data?.resultados.length ? "Estas referencias coinciden con tu consulta en el catálogo municipal." : "No encontré fichas con esos términos. Prueba con bacheo, predial, becas o licencia. También puedes consultar estados, riesgos y equipos de las incidencias."}</p>}
        {catalogo.isError && <p className="mt-2 text-peligro">No se pudo consultar el catálogo. Intenta de nuevo.</p>}
        {!esConsultaCasos && catalogo.data?.resultados.slice(0, 3).map(resultado => <Link key={resultado.servicio.id} to={resultado.servicio.rutaInterna} className="mt-2 flex min-h-11 items-center justify-between gap-2 border-t border-borde py-2 text-xs text-azul">{resultado.servicio.nombre}<ArrowUpRight size={14} aria-hidden="true" /></Link>)}
        <p className="mt-3 text-[11px] text-tinta-suave">Datos de demostración. Respuesta calculada con los filtros actuales y el catálogo; sin IA generativa conectada. La consulta no ejecuta cambios.</p>
      </div>
    </section>}
    {!visible && <div className="op-chat-suggestions"><button onClick={() => enviar({ text: "¿Qué incidencias tienen riesgo declarado?" })}>¿Qué requiere atención? <ArrowUpRight size={12} /></button><button onClick={onArea}>Analizar un área <Hexagon size={12} /></button></div>}
    <div className="relative" onKeyDown={e => { if (e.key === "Escape") setMas(false); }}>
      {mas && <div className="op-context-menu" onKeyDown={e => { if (e.key === "Escape") setMas(false); }}><p className="px-3 pb-2 text-xs text-tinta-suave">Agregar contexto</p><button onClick={() => { setMas(false); onArea(); }}><Hexagon size={18} aria-hidden="true" /><span><strong>Área del mapa</strong><small>Traza una zona para analizarla</small></span></button><button onClick={() => { setMas(false); onFiltrar(""); enviar({ text: "Resumen de incidencias" }); }}><ChartNoAxesCombined size={18} aria-hidden="true" /><span><strong>Resumen operativo</strong><small>Consulta los casos de la vista</small></span></button></div>}
      <AssistantComposer mode={modo} onModeChange={setModo} modes={[{ value: "auto", label: "Resumen", icon: Sparkles }, { value: "catalogo", label: "Catálogo", icon: Search }]} onAttach={() => setMas(v => !v)} onSend={enviar} placeholder={enArea ? "Pregunta sobre esta área de Mérida…" : "¿Qué necesitas saber de Mérida?"} maxRows={4} className="op-composer" />
    </div>
    <p className="op-chat-caption">{enArea ? "Contexto: área seleccionada" : "Mérida, Yucatán"} <span>·</span> Información de demostración</p>
  </div>;
}
