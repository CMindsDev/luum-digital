import { ETIQUETAS_ESTADO } from "../lib/estados";
import { useState } from "react";
import { CheckCheck, ClipboardCheck, MessageCircle, UserRoundPlus } from "lucide-react";
import { Dialog, Button } from "@/design-system";
import { useRegisterAttention, useReportFollowUp, useValidateReport } from "@/services/hooks/reports";
import { NOMBRE_CATEGORIA_REPORTE } from "@/domain/reportes";
import type { Reporte } from "@/types";
import { COLORES_TEMA, ICONO_REPORTE, TONO_REPORTE } from "../lib/categorias";



export function IncidentDetail({ reporte, onCerrar }: { reporte: Reporte; onCerrar: () => void }) {
  const validar = useValidateReport(); const atender = useRegisterAttention(); const seguimiento = useReportFollowUp();
  const [accion, setAccion] = useState<"asignado" | "contacto_simulado" | "atender" | null>(null);
  const [equipo, setEquipo] = useState("Cuadrilla de servicios públicos · Demo");
  const [nota, setNota] = useState(""); const [error, setError] = useState(""); const [exito, setExito] = useState("");
  const ocupado = validar.isPending || atender.isPending || seguimiento.isPending;
  const ejecutar = async (operacion: () => Promise<unknown>, mensaje: string) => {
    setError(""); setExito("");
    try { await operacion(); setExito(mensaje); setAccion(null); setNota(""); }
    catch (e) { setError(e instanceof Error ? e.message : "No pudimos guardar. Intenta de nuevo."); }
  };
  return <Dialog abierto onCerrar={onCerrar} titulo="Atender incidencia" descripcion={`${reporte.folio} · Demostración · Integración simulada`} tamano="lg">
    <div className="space-y-5 pb-4">
      <div className="flex items-start gap-4"><span className={`op-category-icon ${COLORES_TEMA[TONO_REPORTE[reporte.categoria]]}`}><img src={`/brand/tramites/${ICONO_REPORTE[reporte.categoria]}.svg`} alt="" /></span><div><h3 className="text-xl font-semibold">{NOMBRE_CATEGORIA_REPORTE[reporte.categoria]}</h3><p className="mt-1 text-sm text-tinta-suave">{reporte.ubicacion.colonia} · {reporte.ubicacion.referencia}</p></div></div>
      <div className="flex flex-wrap gap-2"><span className="op-badge">{ETIQUETAS_ESTADO[reporte.estadoMunicipal]}</span>{reporte.riesgoDeclarado && <span className="op-badge bg-aviso-suave text-aviso">Riesgo declarado</span>}<span className="op-badge">Verificación ciudadana: {reporte.verificacion.replaceAll("_", " ")}</span></div>
      <p className="text-sm leading-relaxed">{reporte.descripcion}</p>
      <dl className="grid grid-cols-2 gap-3 rounded-tarjeta bg-fondo p-4 text-sm"><div><dt className="text-tinta-suave">Equipo asignado</dt><dd className="mt-1 font-medium">{reporte.equipoAsignado ?? "Sin asignar"}</dd></div><div><dt className="text-tinta-suave">Persona reportante</dt><dd className="mt-1 font-medium">Identidad ficticia · {reporte.identidadId}</dd></div></dl>
      <div className="flex flex-wrap gap-2">
        {(reporte.estadoMunicipal === "registrado" || reporte.estadoMunicipal === "en_proceso") && <Button variante="secundario" iconoInicio={UserRoundPlus} disabled={ocupado} onClick={() => { setAccion("asignado"); setError(""); }}>Asignar equipo</Button>}
        {reporte.estadoMunicipal === "registrado" && <Button iconoInicio={ClipboardCheck} disabled={ocupado} onClick={() => void ejecutar(() => validar.mutateAsync(reporte.id), "Reporte validado. Ahora está en proceso de atención.")}>Validar reporte</Button>}
        {reporte.estadoMunicipal === "en_proceso" && <Button iconoInicio={CheckCheck} disabled={ocupado} onClick={() => { setAccion("atender"); setError(""); }}>Registrar atención</Button>}
        <Button variante="secundario" iconoInicio={MessageCircle} disabled={ocupado} onClick={() => { setAccion("contacto_simulado"); setError(""); }}>Contactar · Demo</Button>
      </div>
      {accion && <form className="space-y-3 rounded-tarjeta border border-borde p-4" onSubmit={e => {
        e.preventDefault();
        if (accion === "atender") void ejecutar(() => atender.mutateAsync({ reporteId: reporte.id, nota }), "Atención simulada registrada. La verificación ciudadana queda pendiente.");
        else void ejecutar(() => seguimiento.mutateAsync({ reporteId: reporte.id, tipo: accion, texto: accion === "asignado" ? equipo : nota }), accion === "asignado" ? "Equipo asignado en la demostración." : "Contacto simulado registrado. No se envió ningún mensaje real.");
      }}>
        {accion === "asignado" ? <label className="block text-sm font-semibold">Equipo de demostración<select className="op-input mt-2" value={equipo} onChange={e => setEquipo(e.target.value)}><option>Cuadrilla de servicios públicos · Demo</option><option>Equipo de obras públicas · Demo</option><option>Equipo de alumbrado · Demo</option><option>Enlace de atención ciudadana · Demo</option></select></label> : <label className="block text-sm font-semibold">{accion === "atender" ? "Detalle de la atención simulada" : "Mensaje de demostración"}<textarea required minLength={3} maxLength={1000} className="op-input mt-2" value={nota} onChange={e => setNota(e.target.value)} placeholder="Describe el seguimiento…" /></label>}
        {accion === "contacto_simulado" && <p className="text-xs text-tinta-suave">Se guardará en el historial de la demo. No se contactará a una persona real.</p>}
        <Button type="submit" disabled={ocupado}>{ocupado ? "Guardando…" : "Confirmar en la demo"}</Button>
      </form>}
      {error && <p role="alert" className="rounded-control bg-peligro-suave p-3 text-sm text-peligro">{error}</p>}
      {exito && <p role="status" className="rounded-control bg-exito-suave p-3 text-sm text-exito">{exito}</p>}
      <section><h3 className="mb-3 font-semibold">Historial del caso</h3><ol className="space-y-3 border-l-2 border-borde pl-4">{[...reporte.historial].reverse().map((h, i) => <li key={`${h.fecha}-${i}`} className="text-sm"><p>{h.descripcion}</p><time className="text-xs text-tinta-suave">{new Date(h.fecha).toLocaleString("es-MX")}</time></li>)}</ol></section>
    </div>
  </Dialog>;
}
