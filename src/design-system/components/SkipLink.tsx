import type { MouseEvent } from "react";

export interface SkipLinkProps {
  /** Id del contenido principal (sin #). */
  destino?: string;
  children?: string;
}

/** Enlace «Saltar al contenido», visible al recibir foco. Mueve el foco sin cambiar la URL. */
export function SkipLink({ destino = "contenido", children = "Saltar al contenido" }: SkipLinkProps) {
  const alActivar = (evento: MouseEvent<HTMLAnchorElement>) => {
    const objetivo = document.getElementById(destino);
    if (!objetivo) return;
    evento.preventDefault();
    if (!objetivo.hasAttribute("tabindex")) objetivo.setAttribute("tabindex", "-1");
    objetivo.focus();
    objetivo.scrollIntoView({ block: "start" });
  };
  return (
    <a
      href={`#${destino}`}
      onClick={alActivar}
      className="superficie-oscura fixed top-2 left-2 z-[100] -translate-y-[200%] rounded-boton bg-marino px-4 py-3 font-semibold text-white shadow-elevada focus:translate-y-0"
    >
      {children}
    </a>
  );
}
