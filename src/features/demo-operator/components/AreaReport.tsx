import { ArrowDownToLine, Pencil, X, MapPin, Activity } from "lucide-react";
import { Button } from "@/design-system";
import { superficieArea, resumenOperativo } from "@/domain/area-operativa";
import type { Coordenadas, Reporte } from "@/types";
import { NOMBRE_CATEGORIA_REPORTE } from "@/domain/reportes";
import { COLORES_TEMA, TONO_REPORTE } from "../lib/categorias";

export function AreaReport({ vertices, reportes, nombre, onNombre, onEditar, onCerrar, onSeleccionar, actualizado }: {
  vertices: Coordenadas[]; reportes: Reporte[]; nombre: string; onNombre: (s: string) => void;
  onEditar: () => void; onCerrar: () => void; onSeleccionar: (id: string) => void; actualizado: number;
}) {
  const resumen = resumenOperativo(reportes);
  const categorias = Object.entries(NOMBRE_CATEGORIA_REPORTE).map(([id, nombre]) => ({ id, nombre, total: reportes.filter(r => r.categoria === id).length })).filter(c => c.total > 0);
  const descargar = () => {
    const texto = [`# ${nombre || "Área de análisis"}`, "Reporte de demostración · Integración simulada", `Actualizado: ${new Date(actualizado).toLocaleString("es-MX")}`, `Superficie aproximada: ${superficieArea(vertices).toFixed(3)} km²`, `Incidencias: ${resumen.total} · Registradas: ${resumen.pendientes} · En proceso: ${resumen.enProceso} · Solucionadas: ${resumen.solucionados} · Canceladas: ${resumen.cancelados}`, "", "Vértices (latitud, longitud):", ...vertices.map(v => `${v.lat}, ${v.lng}`), "", ...reportes.map(r => `${r.folio} | ${NOMBRE_CATEGORIA_REPORTE[r.categoria]} | ${r.estadoMunicipal} | ${r.equipoAsignado ?? "Sin asignar"}`)].join("\n");
    const url = URL.createObjectURL(new Blob([texto], { type: "text/plain;charset=utf-8" }));
    const enlace = document.createElement("a"); enlace.href = url; enlace.download = "reporte-area-demo.txt"; enlace.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="op-area-report" aria-label="Reporte vivo del área">
    <div className="flex items-center justify-between"><span className="op-eyebrow"><Activity size={14} aria-hidden="true" /> Reporte vivo · Demo</span><button className="op-icon-button" aria-label="Cerrar reporte de área" onClick={onCerrar}><X size={18} /></button></div>
    <label className="sr-only" htmlFor="nombre-area">Nombre del área</label><input id="nombre-area" className="mt-2 w-full bg-transparent text-2xl font-semibold outline-none focus-visible:ring-2 focus-visible:ring-foco" maxLength={80} value={nombre} onChange={e => onNombre(e.target.value)} />
    <p className="mt-2 flex items-center gap-1 text-xs text-tinta-suave"><MapPin size={13} aria-hidden="true" /> Delimitación de análisis · {superficieArea(vertices).toFixed(3)} km² aprox.</p>
    <div className="op-area-stats"><div><strong>{resumen.total}</strong><span>incidencias</span></div><div><strong>{resumen.sinAsignar}</strong><span>sin asignar</span></div><div><strong>{resumen.riesgos}</strong><span>con riesgo</span></div></div>
    <h3 className="text-sm font-semibold">Lo que está pasando</h3><p className="mt-2 text-sm leading-relaxed text-tinta-suave">{resumen.total ? `${resumen.pendientes} casos registrados, ${resumen.enProceso} en atención y ${resumen.solucionados} solucionados y ${resumen.cancelados} cancelados. ${resumen.sinAsignar ? "Revisa los casos abiertos que aún no tienen equipo." : "Los casos abiertos cuentan con equipo asignado."}` : "No hay incidencias en esta área con los filtros actuales. Amplía el área o revisa los filtros."}</p>
    <div className="my-5 space-y-3">{categorias.map(c => <div key={c.id}><div className="flex justify-between text-xs"><span>{c.nombre}</span><strong>{c.total}</strong></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-superficie-2"><div className={`h-full rounded-full ${COLORES_TEMA[TONO_REPORTE[c.id as Reporte["categoria"]]]}`} style={{ width: `${c.total / Math.max(resumen.total, 1) * 100}%` }} /></div></div>)}</div>
    <h3 className="mb-2 text-sm font-semibold">Casos en esta área</h3><div className="max-h-40 overflow-auto">{reportes.map(r => <button key={r.id} onClick={() => onSeleccionar(r.id)} className="flex min-h-11 w-full items-center justify-between gap-3 border-b border-borde text-left text-xs hover:text-azul"><span>{NOMBRE_CATEGORIA_REPORTE[r.categoria]}</span><span>{r.folio} ↗</span></button>)}</div>
    <div className="mt-5 flex flex-wrap gap-2"><Button variante="secundario" tamano="sm" iconoInicio={Pencil} onClick={onEditar}>Editar área</Button><Button tamano="sm" iconoInicio={ArrowDownToLine} onClick={descargar}>Descargar reporte</Button></div>
    <p className="mt-4 text-[11px] leading-relaxed text-tinta-suave">Se actualiza con los reportes de esta demostración. Corte: {new Date(actualizado).toLocaleTimeString("es-MX")}. No representa límites oficiales ni datos municipales en tiempo real.</p>
  </section>;
}
