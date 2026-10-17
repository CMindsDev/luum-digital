import { Brain, ChevronRight, HeartHandshake, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { cx } from "@/design-system";
import { msg } from "@/i18n";

interface Acceso {
  titulo: string;
  descripcion: string;
  ruta: string;
  guia: string;
  /** Variante visual: calma (salud mental) o mujeres (acento magenta con texto oscuro). */
  tono: "calma" | "mujeres";
  icono: LucideIcon;
}

const ACCESOS: readonly Acceso[] = [
  {
    titulo: msg("Salud mental"),
    descripcion: msg("Cómo me siento, apoyo para alguien, dónde hay atención y ayuda inmediata."),
    ruta: "/bienestar/salud-mental",
    guia: "bienestar.salud_mental",
    tono: "calma",
    icono: Brain,
  },
  {
    titulo: msg("Línea Mujer"),
    descripcion: msg("Atención a mujeres en situación de violencia: información, línea 24 horas y salida rápida."),
    ruta: "/bienestar/linea-mujer",
    guia: "bienestar.linea_mujer",
    tono: "mujeres",
    icono: HeartHandshake,
  },
];

const TONOS = {
  calma: { tarjeta: "hover:border-azul focus-visible:border-azul", icono: "bg-azul-suave text-azul" },
  mujeres: { tarjeta: "hover:border-magenta-tinta focus-visible:border-magenta-tinta", icono: "bg-magenta-suave text-magenta-tinta" },
} as const;

/** Accesos a las vistas internas de Salud mental y Línea Mujer. */
export function AccesosBienestar() {
  const { t } = useTranslation();

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
                "group flex h-full min-h-28 items-start gap-4 rounded-tarjeta border-2 border-borde bg-superficie p-5 no-underline shadow-suave transition-[border-color,box-shadow] duration-(--duracion-media) ease-suave hover:shadow-elevada motion-reduce:transition-none",
                TONOS[acceso.tono].tarjeta,
              )}
            >
              <span className={cx("inline-flex size-12 shrink-0 items-center justify-center rounded-boton", TONOS[acceso.tono].icono)}>
                <Icono aria-hidden="true" className="size-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-semibold text-marino underline-offset-4 group-hover:underline group-focus-visible:underline">{t(acceso.titulo)}</span>
                <span className="mt-1 block text-[0.9375rem] text-tinta">{t(acceso.descripcion)}</span>
              </span>
              <ChevronRight aria-hidden="true" className="mt-1 size-5 shrink-0 text-marino" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
