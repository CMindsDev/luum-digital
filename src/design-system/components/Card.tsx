import type { ElementType, HTMLAttributes, Ref } from "react";
import { cx } from "../lib/cx";

export type RellenoCard = "ninguno" | "sm" | "md" | "lg";
export type TonoCard = "superficie" | "crema" | "suave" | "marino";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Elemento semántico: div (por omisión), article, section, li, aside. */
  as?: ElementType;
  relleno?: RellenoCard;
  tono?: TonoCard;
  /** Realza al pasar el puntero (para tarjetas que contienen un enlace principal). */
  interactiva?: boolean;
  ref?: Ref<HTMLElement>;
}

const RELLENOS: Record<RellenoCard, string> = { ninguno: "", sm: "p-3", md: "p-4 sm:p-5", lg: "p-5 sm:p-7" };

const TONOS: Record<TonoCard, string> = {
  superficie: "bg-superficie border border-borde shadow-suave",
  crema: "bg-fondo border border-borde",
  suave: "bg-superficie-2 border border-transparent",
  // texto blanco sobre marino 12.06:1
  marino: "bg-marino text-white superficie-oscura",
};

/** Contenedor con radio de tarjeta del Laboratorio (22 px) y sombra suave teñida de marino. */
export function Card({ as: Elemento = "div", relleno = "md", tono = "superficie", interactiva = false, className, ...resto }: CardProps) {
  return (
    <Elemento
      className={cx(
        "rounded-tarjeta",
        TONOS[tono],
        RELLENOS[relleno],
        interactiva &&
          "transition-[box-shadow,transform] duration-(--duracion-media) ease-suave hover:shadow-elevada motion-safe:hover:-translate-y-0.5",
        className,
      )}
      {...resto}
    />
  );
}
