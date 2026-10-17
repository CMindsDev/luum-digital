import { MapPin } from "lucide-react";

export interface PinMarcadorProps {
  /** Texto accesible del marcador. */
  etiqueta: string;
}

/** Pin del lugar elegido (marino con borde blanco; visible sobre cualquier mapa base). */
export function PinMarcador({ etiqueta }: PinMarcadorProps) {
  return (
    <span role="img" aria-label={etiqueta} title={etiqueta} className="block cursor-grab active:cursor-grabbing">
      <MapPin aria-hidden="true" className="size-11 fill-marino text-white drop-shadow-md" strokeWidth={1.6} />
    </span>
  );
}
