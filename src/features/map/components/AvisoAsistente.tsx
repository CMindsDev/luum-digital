import { Sparkles, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router";
import { IconButton } from "@/design-system";
import { NOMBRE_CATEGORIA_REPORTE } from "@/domain/reportes";
import type { PrefillAsistente } from "@/types";

type PrefillMapa = Extract<PrefillAsistente, { tipo: "mapa" }>;

function esPrefillMapa(estado: unknown): estado is { prefill: PrefillMapa } {
  if (typeof estado !== "object" || estado === null || !("prefill" in estado)) return false;
  const prefill = estado.prefill;
  return typeof prefill === "object" && prefill !== null && "tipo" in prefill && prefill.tipo === "mapa";
}

const NOMBRE_VISTA: Record<NonNullable<PrefillMapa["vista"]>, string> = {
  puntos: "puntos",
  calor: "mapa de calor",
  celdas: "zonas",
  lista: "lista",
};

/**
 * Aviso de que el asistente (Pekito) abrió el Visor con filtros. Los filtros ya están en la URL:
 * la persona puede cambiarlos o quitarlos cuando quiera. El aviso no ejecuta nada.
 */
export function AvisoAsistente() {
  const { state, key } = useLocation();
  const [descartado, setDescartado] = useState<string | null>(null);
  if (!esPrefillMapa(state) || descartado === key) return null;
  const { categoria, vista } = state.prefill;
  const detalles = [categoria ? `tipo «${NOMBRE_CATEGORIA_REPORTE[categoria]}»` : null, vista ? `vista ${NOMBRE_VISTA[vista]}` : null].filter(Boolean);
  return (
    <div role="status" className="mb-4 flex items-start gap-3 rounded-tarjeta border border-magenta/40 bg-magenta-suave px-4 py-3">
      <Sparkles aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-magenta-tinta" />
      <p className="min-w-0 flex-1 text-sm text-tinta">
        <strong className="font-semibold text-magenta-tinta">Abierto por Pekito, el asistente de demostración.</strong>{" "}
        {detalles.length > 0 ? `Preparó el mapa con ${detalles.join(" y ")}. ` : ""}
        Revisa los filtros y cámbialos cuando quieras.
      </p>
      <IconButton etiqueta="Cerrar aviso del asistente" icono={X} onClick={() => setDescartado(key)} className="-my-2 -mr-2" />
    </div>
  );
}
