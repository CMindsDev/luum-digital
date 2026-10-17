/**
 * Encuentra en el DOM el control señalable (data-guia) que la persona puede ver y tocar ahora
 * (portado de Alex/Marea, guide-element.ts). La capa de actuación y el señalado comparten la regla:
 * nunca se señala una copia oculta, inerte o tapada por un diálogo.
 * La interfaz de Pekito (data-asistente-ui) no cuenta como diálogo: cede la pantalla al actuar.
 */
import type { Caja } from "./actuacion-trayectoria";

const SELECTOR_UI_ASISTENTE = "[data-asistente-ui]";

function interseccion(a: Caja, b: Caja): Caja {
  return { left: Math.max(a.left, b.left), top: Math.max(a.top, b.top), right: Math.min(a.right, b.right), bottom: Math.min(a.bottom, b.bottom) };
}

/** Diálogos modales abiertos que no son de Pekito: fuera de ellos todo es inerte. */
function modalesAbiertos(): Element[] {
  try {
    return Array.from(document.querySelectorAll("dialog:modal")).filter((dialogo) => !dialogo.closest(SELECTOR_UI_ASISTENTE));
  } catch {
    return [];
  }
}

function tapadoPorDialogo(elemento: Element): boolean {
  const rect = elemento.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const raiz = document.documentElement;
  if (x < 0 || y < 0 || x > raiz.clientWidth || y > raiz.clientHeight) return false;
  const capa = document.elementFromPoint(x, y)?.closest("dialog");
  return Boolean(capa && !capa.contains(elemento) && !capa.closest(SELECTOR_UI_ASISTENTE));
}

function seMuestra(elemento: Element): boolean {
  if (!elemento.isConnected || elemento.getClientRects().length === 0) return false;
  if (elemento.closest("[inert], [hidden], [aria-hidden='true']")) return false;
  return typeof elemento.checkVisibility !== "function" || elemento.checkVisibility({ visibilityProperty: true });
}

/** Escapa un id para usarlo en un selector de atributo. */
function selectorGuia(id: string): string {
  return `[data-guia="${id.replace(/["\\]/g, "\\$&")}"]`;
}

/** Primer elemento marcado con `id` que la persona puede ver y tocar ahora (nunca de la UI de Pekito). */
export function resolverElementoGuia(id: string): Element | null {
  const modales = modalesAbiertos();
  for (const elemento of Array.from(document.querySelectorAll(selectorGuia(id)))) {
    if (elemento.closest(SELECTOR_UI_ASISTENTE)) continue;
    if (seMuestra(elemento) && modales.every((dialogo) => dialogo.contains(elemento)) && !tapadoPorDialogo(elemento)) return elemento;
  }
  return null;
}

/** Parte de la ventana donde se ve `elemento`, recortada por los ancestros que ocultan su desborde. */
export function areaVisible(elemento: Element): Caja {
  const raiz = document.documentElement;
  let area: Caja = { left: 0, top: 0, right: raiz.clientWidth, bottom: raiz.clientHeight };
  for (let nodo = elemento.parentElement; nodo && nodo !== document.body && nodo !== raiz; nodo = nodo.parentElement) {
    const estilo = getComputedStyle(nodo);
    if (estilo.overflowX !== "visible" || estilo.overflowY !== "visible") area = interseccion(area, nodo.getBoundingClientRect());
    if (estilo.position === "fixed") break;
  }
  return area;
}
