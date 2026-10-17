import type { KeyboardEvent } from "react";

/**
 * Índice destino para navegación con flechas (roving tabindex): ←/→ (y ↑/↓ si `vertical`),
 * Inicio y Fin. Devuelve null si la tecla no aplica. Salta las opciones deshabilitadas.
 */
export function indiceConTeclado(
  evento: KeyboardEvent,
  actual: number,
  total: number,
  { vertical = false, deshabilitadas = [] as boolean[] } = {},
): number | null {
  const siguiente = vertical ? ["ArrowDown", "ArrowRight"] : ["ArrowRight"];
  const anterior = vertical ? ["ArrowUp", "ArrowLeft"] : ["ArrowLeft"];
  let paso: number;
  let inicio: number;
  if (siguiente.includes(evento.key)) {
    paso = 1;
    inicio = actual;
  } else if (anterior.includes(evento.key)) {
    paso = -1;
    inicio = actual;
  } else if (evento.key === "Home") {
    paso = 1;
    inicio = -1;
  } else if (evento.key === "End") {
    paso = -1;
    inicio = total;
  } else {
    return null;
  }
  for (let i = 1; i <= total; i += 1) {
    const candidato = (((inicio + paso * i) % total) + total) % total;
    if (!deshabilitadas[candidato]) return candidato;
  }
  return null;
}
