import { MapPinOff } from "lucide-react";
import { lazy, Suspense } from "react";
import { ErrorBoundaryLocal } from "@/app/shell/ErrorBoundaryLocal";
import { Button, LoadingState } from "@/design-system";
import type { Coordenadas } from "@/types";

// El mapa (M4) se carga sólo si la persona elige «Elegir en el mapa»: el formulario no depende de él.
const SelectorUbicacion = lazy(() => import("@/components/mapa/SelectorUbicacion").then((modulo) => ({ default: modulo.SelectorUbicacion })));

export interface MapaUbicacionProps {
  valor: Coordenadas | null;
  onCambiar: (coordenadas: Coordenadas) => void;
  /** Vuelve a la dirección escrita si el mapa no está disponible. */
  onUsarDireccion: () => void;
}

function MapaNoDisponible({ onUsarDireccion }: Pick<MapaUbicacionProps, "onUsarDireccion">) {
  return (
    <div role="status" className="flex flex-col gap-3 rounded-tarjeta border border-ambar bg-aviso-suave p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2 text-[0.9375rem] text-tinta">
        <MapPinOff aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-aviso" />
        El mapa no está disponible en este momento. Puedes escribir la dirección o usar la ubicación de tu dispositivo.
      </p>
      <Button variante="secundario" tamano="sm" onClick={onUsarDireccion}>
        Escribir la dirección
      </Button>
    </div>
  );
}

/** Selector de ubicación en el mapa con respaldo: si el mapa falla, el formulario sigue. */
export function MapaUbicacion({ valor, onCambiar, onUsarDireccion }: MapaUbicacionProps) {
  return (
    <ErrorBoundaryLocal respaldo={<MapaNoDisponible onUsarDireccion={onUsarDireccion} />}>
      <Suspense fallback={<LoadingState etiqueta="Cargando el mapa…" variante="compacto" className="py-6" />}>
        <SelectorUbicacion valor={valor} onCambiar={onCambiar} etiqueta="Ubicación del reporte" guia="reportes" />
      </Suspense>
    </ErrorBoundaryLocal>
  );
}
