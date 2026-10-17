import { AyudaInmediata } from "@/components/ayuda/AyudaInmediata";

export interface BarraAyudaInmediataProps {
  abierta: boolean;
  onCambiar: (abierta: boolean) => void;
}

/**
 * Barra fija bajo el encabezado del AppShell con «Ayuda inmediata»: siempre visible al desplazarse
 * y funcional sin conversar antes.
 */
export function BarraAyudaInmediata({ abierta, onCambiar }: BarraAyudaInmediataProps) {
  return (
    <div className="sticky top-[calc(var(--altura-encabezado)+0.5rem)] z-30 mb-6">
      <div className="flex flex-col gap-2 rounded-tarjeta border border-peligro/30 bg-superficie/95 px-4 py-3 shadow-elevada backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-tinta">
          <strong className="font-semibold text-peligro">¿Estás en peligro o necesitas hablar con alguien ya?</strong>{" "}
          <span className="text-tinta-suave">No necesitas conversar primero.</span>
        </p>
        <AyudaInmediata
          enfoque="salud_mental"
          guia="salud_mental.ayuda_inmediata"
          abierto={abierta}
          onAbiertoChange={onCambiar}
          className="shrink-0"
        />
      </div>
    </div>
  );
}
