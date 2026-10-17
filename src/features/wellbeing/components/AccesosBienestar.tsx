import { ChevronRight, HeartHandshake, type LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { cx, LabGlyph } from "@/design-system";

interface Acceso {
  titulo: string;
  descripcion: string;
  ruta: string;
  guia: string;
  /** Variante visual: calma (salud mental) o mujeres (acento magenta con texto oscuro). */
  tono: "calma" | "mujeres";
  icono?: LucideIcon;
}

const ACCESOS: readonly Acceso[] = [
  {
    titulo: "Salud mental",
    descripcion: "Cómo me siento, apoyo para alguien, dónde hay atención y ayuda inmediata.",
    ruta: "/bienestar/salud-mental",
    guia: "bienestar.salud_mental",
    tono: "calma",
  },
  {
    titulo: "Línea Mujer",
    descripcion: "Atención a mujeres en situación de violencia: información, línea 24 horas y salida rápida.",
    ruta: "/bienestar/linea-mujer",
    guia: "bienestar.linea_mujer",
    tono: "mujeres",
    icono: HeartHandshake,
  },
];

const TONOS = {
  calma: { tarjeta: "bg-azul-suave border-azul/20", icono: "bg-superficie text-azul" },
  mujeres: { tarjeta: "bg-magenta-suave border-magenta/40", icono: "bg-superficie text-magenta-tinta" },
} as const;

/** Accesos a las vistas internas de Salud mental y Línea Mujer. */
export function AccesosBienestar() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {ACCESOS.map((acceso) => {
        const Icono = acceso.icono;
        return (
          <li key={acceso.ruta}>
            <Link
              to={acceso.ruta}
              data-guia={acceso.guia}
              className={cx(
                "group flex h-full min-h-28 items-start gap-4 rounded-tarjeta border p-5 no-underline shadow-suave transition-[box-shadow,transform] duration-(--duracion-media) ease-suave hover:shadow-elevada motion-safe:hover:-translate-y-0.5",
                TONOS[acceso.tono].tarjeta,
              )}
            >
              <span className={cx("inline-flex size-12 shrink-0 items-center justify-center rounded-boton", TONOS[acceso.tono].icono)}>
                {Icono ? <Icono aria-hidden="true" className="size-6" /> : <LabGlyph tamano={24} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-semibold text-marino">{acceso.titulo}</span>
                <span className="mt-1 block text-[0.9375rem] text-tinta">{acceso.descripcion}</span>
              </span>
              <ChevronRight aria-hidden="true" className="mt-1 size-5 shrink-0 text-marino transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
