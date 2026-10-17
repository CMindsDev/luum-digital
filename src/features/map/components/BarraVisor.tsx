import { Flame, Hexagon, List, Map as IconoMapa, MapPin, SlidersHorizontal } from "lucide-react";
import { Button, SegmentedControl } from "@/design-system";
import type { ModoVista, Representacion } from "../estado-url";

export interface BarraVisorProps {
  vista: ModoVista;
  capa: Representacion;
  onVista: (vista: ModoVista) => void;
  onCapa: (capa: Representacion) => void;
  /** Si se da, muestra el botón que abre los filtros en una hoja (móvil y tableta). */
  onAbrirFiltros?: () => void;
  filtrosActivos: number;
}

/** Vista (Mapa / Lista), representación de las incidencias y acceso a filtros. */
export function BarraVisor({ vista, capa, onVista, onCapa, onAbrirFiltros, filtrosActivos }: BarraVisorProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <SegmentedControl<ModoVista>
        etiqueta="Vista del visor"
        guia="mapa.vista"
        valor={vista}
        onCambiar={onVista}
        opciones={[
          { valor: "mapa", etiqueta: "Mapa", icono: IconoMapa },
          { valor: "lista", etiqueta: "Lista", icono: List },
        ]}
      />
      {onAbrirFiltros ? (
        <Button variante="secundario" iconoInicio={SlidersHorizontal} onClick={onAbrirFiltros} aria-haspopup="dialog" data-guia="mapa.filtros">
          Filtros
          {filtrosActivos > 0 ? <span className="rounded-pildora bg-marino px-2 text-xs leading-5 text-white">{filtrosActivos}</span> : null}
          {filtrosActivos > 0 ? <span className="sr-only"> activos</span> : null}
        </Button>
      ) : null}
      {vista === "mapa" ? (
        <SegmentedControl<Representacion>
          etiqueta="Cómo ver las incidencias en el mapa"
          guia="mapa.representacion"
          valor={capa}
          onCambiar={onCapa}
          opciones={[
            { valor: "puntos", etiqueta: "Puntos", icono: MapPin },
            { valor: "calor", etiqueta: "Calor", icono: Flame },
            { valor: "celdas", etiqueta: "Zonas", icono: Hexagon },
          ]}
        />
      ) : null}
    </div>
  );
}
