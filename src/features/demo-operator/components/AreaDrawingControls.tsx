import { useEffect } from "react";
import { Check, Hand, MousePointer2, RotateCcw, Trash2, Undo2, X } from "lucide-react";
import { diagnosticoArea, superficieArea } from "@/domain/area-operativa";
import type { Coordenadas } from "@/types";
import type { EstadoTrazado } from "../lib/trazado";

interface Props {
  trazado: EstadoTrazado;
  casos: number;
  error: string;
  bloquearAtajos: boolean;
  onModo: (modo: EstadoTrazado["modo"]) => void;
  onDeshacer: () => void;
  onReiniciar: () => void;
  onEliminar: () => void;
  onConfirmar: () => void;
  onCancelar: () => void;
  onManual: () => void;
}
function superficieLegible(vertices: Coordenadas[]) {
  const km = superficieArea(vertices);
  return km < 0.01 ? `${Math.round(km * 1_000_000).toLocaleString("es-MX")} m²` : `${km.toLocaleString("es-MX", { maximumFractionDigits: 2 })} km²`;
}
export function AreaDrawingControls({ trazado, casos, error, bloquearAtajos, onModo, onDeshacer, onReiniciar, onEliminar, onConfirmar, onCancelar, onManual }: Props) {
  const { vertices, modo, anteriores, seleccionado } = trazado;
  const diagnostico = diagnosticoArea(vertices);
  const listo = diagnostico === null;
  useEffect(() => {
    if (bloquearAtajos) return;
    const manejar = (e: KeyboardEvent) => {
      if (e.defaultPrevented || (e.target instanceof HTMLElement && (e.target.closest("input, textarea, select, button, [contenteditable=true]")))) return;
      if (e.key === "Escape") { e.preventDefault(); onCancelar(); }
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); onDeshacer(); }
      else if (e.key === "Enter" && listo) { e.preventDefault(); onConfirmar(); }
    };
    window.addEventListener("keydown", manejar);
    return () => window.removeEventListener("keydown", manejar);
  }, [bloquearAtajos, listo, onCancelar, onConfirmar, onDeshacer]);
  return <>
    <section className="op-draw-guide" aria-label="Guía de trazado">
      <div><p className="op-eyebrow">{modo === "trazar" ? "Dibujando un área" : "Moviendo el mapa"}</p><h2>{modo === "mover" ? "Ajusta la vista y vuelve a Dibujar" : vertices.length === 0 ? "Toca el mapa para empezar" : vertices.length < 3 ? "Sigue marcando el perímetro" : "Arrastra los puntos para afinar el área"}</h2><p>{modo === "mover" ? "Arrastra para desplazarte; usa + y − o pellizca para acercarte." : vertices.length >= 3 ? "Toca el punto 1 para cerrar, o usa Analizar área." : "Cada toque agrega un punto. El trazo aparece desde el segundo."}</p></div>
      <button type="button" className="op-icon-button" aria-label="Cancelar trazado" onClick={onCancelar}><X size={19} aria-hidden="true" /></button>
    </section>
    <section className="op-draw-tools" aria-label="Herramientas de trazado">
      <div className="op-draw-tools-top"><div className="op-draw-mode" role="group" aria-label="Interacción con el mapa"><button type="button" aria-pressed={modo === "trazar"} onClick={() => onModo("trazar")}><MousePointer2 size={16} aria-hidden="true" /> Dibujar</button><button type="button" aria-pressed={modo === "mover"} onClick={() => onModo("mover")}><Hand size={16} aria-hidden="true" /> Mover mapa</button></div><span className="op-draw-tally" role="status">{vertices.length} puntos{listo && <> · {superficieLegible(vertices)} aprox. · {casos} incidencias</>}</span><button type="button" className="op-draw-manual" onClick={onManual}>Coordenadas</button></div>
      <div className="op-draw-tools-bottom"><div className="op-draw-edit-actions"><button type="button" className="op-icon-button" aria-label="Deshacer último cambio" title="Deshacer · Ctrl/⌘ Z" disabled={!anteriores.length} onClick={onDeshacer}><Undo2 size={18} aria-hidden="true" /></button><button type="button" className="op-icon-button" aria-label="Reiniciar dibujo" title="Reiniciar dibujo" disabled={!vertices.length} onClick={onReiniciar}><RotateCcw size={18} aria-hidden="true" /></button>{seleccionado !== null && <button type="button" className="op-icon-button" aria-label={`Eliminar punto ${seleccionado + 1}`} title={`Eliminar punto ${seleccionado + 1}`} onClick={onEliminar}><Trash2 size={17} aria-hidden="true" /></button>}</div><button type="button" className="op-draw-finish" disabled={!listo} onClick={onConfirmar}><Check size={17} aria-hidden="true" /> Analizar área</button></div>
      {(error || (vertices.length >= 3 && diagnostico)) && <p role="alert" className="op-draw-error">{error || diagnostico}</p>}
    </section>
  </>;
}
