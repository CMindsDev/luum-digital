import { ChevronRight, LifeBuoy, MapPin, MessageCircle, Users, type LucideIcon } from "lucide-react";
import { cx } from "@/design-system";

export type EntradaSaludMental = "hablar" | "apoyo_alguien" | "encontrar_atencion" | "ayuda_inmediata";

interface Entrada {
  id: EntradaSaludMental;
  titulo: string;
  descripcion: string;
  icono: LucideIcon;
  guia: string;
}

const ENTRADAS: readonly Entrada[] = [
  {
    id: "hablar",
    titulo: "Quiero hablar de cómo me siento",
    descripcion: "Conversación de demostración, a tu ritmo y sin juicios.",
    icono: MessageCircle,
    guia: "salud_mental.hablar",
  },
  {
    id: "apoyo_alguien",
    titulo: "Busco apoyo para alguien",
    descripcion: "Ideas para acompañar a otra persona y dónde pedir ayuda.",
    icono: Users,
    guia: "salud_mental.apoyo_alguien",
  },
  {
    id: "encontrar_atencion",
    titulo: "Quiero encontrar atención",
    descripcion: "Apoyo psicológico gratuito del Ayuntamiento, con cita.",
    icono: MapPin,
    guia: "salud_mental.encontrar",
  },
  {
    id: "ayuda_inmediata",
    titulo: "Necesito ayuda inmediata",
    descripcion: "911 y líneas atendidas por personas, sin conversar antes.",
    icono: LifeBuoy,
    guia: "salud_mental.necesito_ayuda",
  },
];

export interface EntradasSaludMentalProps {
  onElegir: (entrada: EntradaSaludMental) => void;
}

/** Las cuatro entradas de salud mental. «Necesito ayuda inmediata» abre la ayuda sin pasar por el chat. */
export function EntradasSaludMental({ onElegir }: EntradasSaludMentalProps) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {ENTRADAS.map((entrada) => {
        const Icono = entrada.icono;
        const urgente = entrada.id === "ayuda_inmediata";
        return (
          <li key={entrada.id}>
            <button
              type="button"
              onClick={() => onElegir(entrada.id)}
              data-guia={entrada.guia}
              aria-haspopup={urgente ? "dialog" : undefined}
              className={cx(
                "group flex h-full min-h-24 w-full items-start gap-3 rounded-tarjeta border p-4 text-left shadow-suave transition-[box-shadow,transform] duration-(--duracion-media) ease-suave hover:shadow-elevada motion-safe:hover:-translate-y-0.5",
                urgente ? "border-peligro/40 bg-peligro-suave" : "border-borde bg-superficie",
              )}
            >
              <span
                className={cx(
                  "inline-flex size-11 shrink-0 items-center justify-center rounded-boton",
                  urgente ? "bg-superficie text-peligro" : "bg-azul-suave text-azul",
                )}
              >
                <Icono aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cx("block font-semibold", urgente ? "text-peligro" : "text-marino")}>{entrada.titulo}</span>
                <span className="mt-0.5 block text-sm text-tinta-suave">{entrada.descripcion}</span>
              </span>
              <ChevronRight aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-tinta-suave" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
