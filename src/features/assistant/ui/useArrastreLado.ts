import { useEffect, useRef, type RefObject } from "react";
import type { LadoPekito } from "./pekito-preferencias";

/** Distancia mínima para que un toque cuente como arrastre (y no como clic). */
const UMBRAL_PX = 8;

/** Lado que corresponde a una posición horizontal. */
export function ladoEn(x: number, ancho: number): LadoPekito {
  return x < ancho / 2 ? "izquierda" : "derecha";
}

interface OpcionesArrastre {
  /** Elemento que se toma para arrastrar (el botón de la mascota). */
  asa: RefObject<HTMLElement | null>;
  /** Contenedor que se mueve (la presencia completa). */
  contenedor: RefObject<HTMLElement | null>;
  onSoltar: (lado: LadoPekito) => void;
}

/**
 * Mueve la mascota de lado (portado de useDockDrag de Alex/Marea, sólo en horizontal): se arrastra
 * con el puntero y, al soltar, se acomoda a la izquierda o a la derecha. Con teclado: Alt + flecha.
 * Un arrastre nunca se convierte en clic.
 */
export function useArrastreLado({ asa, contenedor, onSoltar }: OpcionesArrastre) {
  const onSoltarRef = useRef(onSoltar);
  useEffect(() => {
    onSoltarRef.current = onSoltar;
  });

  useEffect(() => {
    const boton = asa.current;
    const caja = contenedor.current;
    if (!boton || !caja) return;
    let inicio: { x: number; id: number } | null = null;
    let arrastrando = false;
    let temporizador = 0;

    const tragar = (evento: Event) => {
      evento.preventDefault();
      evento.stopPropagation();
    };
    const limpiar = () => {
      caja.style.transform = "";
      delete caja.dataset.arrastrando;
    };
    const abajo = (evento: PointerEvent) => {
      if (evento.button !== 0) return;
      inicio = { x: evento.clientX, id: evento.pointerId };
      arrastrando = false;
    };
    const mover = (evento: PointerEvent) => {
      if (!inicio || evento.pointerId !== inicio.id) return;
      const dx = evento.clientX - inicio.x;
      if (!arrastrando && Math.abs(dx) < UMBRAL_PX) return;
      if (!arrastrando) {
        arrastrando = true;
        boton.setPointerCapture?.(evento.pointerId);
      }
      caja.dataset.arrastrando = "true";
      caja.style.transform = `translateX(${dx}px)`;
    };
    const arriba = (evento: PointerEvent) => {
      if (!inicio || evento.pointerId !== inicio.id) return;
      inicio = null;
      if (!arrastrando) return;
      arrastrando = false;
      boton.addEventListener("click", tragar, { capture: true, once: true });
      window.clearTimeout(temporizador);
      temporizador = window.setTimeout(() => boton.removeEventListener("click", tragar, true), 400);
      limpiar();
      if (evento.type !== "pointercancel") onSoltarRef.current(ladoEn(evento.clientX, window.innerWidth));
    };
    const teclado = (evento: KeyboardEvent) => {
      if (!evento.altKey || (evento.key !== "ArrowLeft" && evento.key !== "ArrowRight")) return;
      evento.preventDefault();
      onSoltarRef.current(evento.key === "ArrowLeft" ? "izquierda" : "derecha");
    };

    boton.addEventListener("pointerdown", abajo);
    boton.addEventListener("pointermove", mover);
    boton.addEventListener("pointerup", arriba);
    boton.addEventListener("pointercancel", arriba);
    boton.addEventListener("keydown", teclado);
    return () => {
      window.clearTimeout(temporizador);
      boton.removeEventListener("pointerdown", abajo);
      boton.removeEventListener("pointermove", mover);
      boton.removeEventListener("pointerup", arriba);
      boton.removeEventListener("pointercancel", arriba);
      boton.removeEventListener("keydown", teclado);
      boton.removeEventListener("click", tragar, true);
      limpiar();
    };
  }, [asa, contenedor]);
}
