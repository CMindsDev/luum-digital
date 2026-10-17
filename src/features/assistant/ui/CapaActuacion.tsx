import { useEffect } from "react";
import { suscribirActuacion, type EventoActuacion } from "../runtime/acting-bus";
import {
  ACTUACION,
  agrandarRadio,
  ALCANCE_ANILLO_PX,
  cajaAnillo,
  cuadrosDeVuelo,
  distancia,
  duracionVuelo,
  puntoDeAterrizaje,
  type Punto,
} from "./actuacion-trayectoria";
import { areaVisible, resolverElementoGuia } from "./elemento-guia";

const PUNTERO_FINO = "(hover: hover) and (pointer: fine)";
const MOVIMIENTO_REDUCIDO = "(prefers-reduced-motion: reduce)";
const ATRIBUTO_ACTUANDO = "data-pekito-actuando";
const SELECTOR_ORIGEN = "[data-pekito-origen]";
const SVG_NS = "http://www.w3.org/2000/svg";
/** Un señalado justo después de que el cursor presionó el mismo control no agrega nada. */
const ECO_MS = 800;

interface Cursor {
  id: string;
  objetivo: string;
  elemento: Element;
  nodo: HTMLElement;
  origen: Punto;
  en: Punto;
  cadena: Promise<void>;
  sinPresion: boolean;
  fuera: boolean;
}

function coincide(consulta: string): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia(consulta).matches;
}

/** Dentro de un diálogo abierto la señal debe vivir en él para quedar encima. */
function anfitrion(elemento: Element): HTMLElement {
  const dialogo = elemento.closest("dialog[open]");
  return dialogo instanceof HTMLElement ? dialogo : document.body;
}

function colocar(nodo: HTMLElement, contenedor: HTMLElement): Punto {
  contenedor.append(nodo);
  const rect = nodo.getBoundingClientRect();
  return { x: rect.left, y: rect.top };
}

function aterrizajeDe(elemento: Element): Punto {
  return puntoDeAterrizaje(elemento.getBoundingClientRect(), areaVisible(elemento));
}

/** Centro de la mascota flotante: de ahí sale el cursor. */
function centroDeLaMascota(): Punto | null {
  for (const origen of Array.from(document.querySelectorAll(SELECTOR_ORIGEN))) {
    const rect = origen.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }
  return null;
}

function trasladar(punto: Punto, origen: Punto, escala = 1): string {
  const mover = `translate(${punto.x - origen.x}px, ${punto.y - origen.y}px)`;
  return escala === 1 ? mover : `${mover} scale(${escala})`;
}

function terminada(animacion: Animation): Promise<void> {
  return animacion.finished.then(
    () => undefined,
    () => undefined,
  );
}

function nodoCursor(): HTMLElement {
  const nodo = document.createElement("div");
  nodo.className = "pekito-cursor-guia";
  nodo.setAttribute("aria-hidden", "true");
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 14 14");
  svg.setAttribute("width", String(ACTUACION.cursorPx));
  svg.setAttribute("height", String(ACTUACION.cursorPx));
  const flecha = document.createElementNS(SVG_NS, "path");
  flecha.setAttribute("d", "M1.5 1.5v10.2l2.9-2.6 2 4.1 2-1-2-4h3.9z");
  svg.append(flecha);
  nodo.append(svg);
  return nodo;
}

/**
 * Vida completa de la capa: escucha el bus y dibuja con la Web Animations API. Nada de lo que
 * agrega recibe el puntero; nunca dispara eventos: la acción siempre corre por su handle tipado.
 */
function iniciarCapa(): () => void {
  const raiz = document.documentElement;
  const objetivos = new Map<string, string | null>();
  const cedidas = new Set<string>();
  const anillos = new Set<() => void>();
  const temporizadoresBorde = new Map<string, number>();
  const actuando = new Map<string, number>();
  let cursor: Cursor | null = null;
  let ultimaPresion: { objetivo: string; en: number } | null = null;
  let caducidad = 0;

  const borde = document.createElement("div");
  borde.className = "pekito-borde-actuacion";
  borde.setAttribute("aria-hidden", "true");
  document.body.append(borde);

  const sincronizarBorde = () => {
    if (actuando.size) raiz.setAttribute(ATRIBUTO_ACTUANDO, "");
    else raiz.removeAttribute(ATRIBUTO_ACTUANDO);
  };

  const iniciarBorde = (id: string) => {
    if (temporizadoresBorde.has(id) || actuando.has(id)) return;
    const temporizador = window.setTimeout(() => {
      temporizadoresBorde.delete(id);
      actuando.set(
        id,
        window.setTimeout(() => detenerBorde(id), ACTUACION.caducidadMs),
      );
      sincronizarBorde();
    }, ACTUACION.bordeTrasMs);
    temporizadoresBorde.set(id, temporizador);
  };

  function detenerBorde(id: string) {
    window.clearTimeout(temporizadoresBorde.get(id));
    window.clearTimeout(actuando.get(id));
    temporizadoresBorde.delete(id);
    actuando.delete(id);
    sincronizarBorde();
  }

  const quitarCursor = (actual: Cursor) => {
    actual.fuera = true;
    actual.nodo.remove();
    if (cursor === actual) {
      cursor = null;
      window.clearTimeout(caducidad);
    }
  };

  const desvanecer = (actual: Cursor, conservarPresion: boolean) => {
    if (!conservarPresion) actual.sinPresion = true;
    actual.cadena = actual.cadena.then(async () => {
      if (actual.fuera) return;
      await terminada(actual.nodo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ACTUACION.desvanecerMs, fill: "forwards" }));
      quitarCursor(actual);
    });
  };

  const presionar = (actual: Cursor) => {
    actual.cadena = actual.cadena.then(async () => {
      if (actual.fuera || actual.sinPresion) return;
      if (!actual.elemento.isConnected) {
        quitarCursor(actual);
        return;
      }
      const ahora = aterrizajeDe(actual.elemento);
      const presion = actual.nodo.animate(
        [
          { transform: trasladar(actual.en, actual.origen) },
          { transform: trasladar(ahora, actual.origen, ACTUACION.presionEscala), offset: 0.5 },
          { transform: trasladar(ahora, actual.origen) },
        ],
        { duration: ACTUACION.presionMs, easing: "ease-out", fill: "forwards" },
      );
      actual.en = ahora;
      ultimaPresion = { objetivo: actual.objetivo, en: performance.now() };
      await terminada(presion);
    });
  };

  const volar = (id: string, objetivo: string) => {
    const elemento = resolverElementoGuia(objetivo);
    if (!elemento) return;
    const nodo = nodoCursor();
    const origen = colocar(nodo, anfitrion(elemento));
    const hasta = aterrizajeDe(elemento);
    const desde = centroDeLaMascota() ?? hasta;
    const duracion = distancia(desde, hasta) > 0 ? duracionVuelo(desde, hasta) : 0;
    const vuelo = nodo.animate(
      cuadrosDeVuelo(desde, hasta).map((punto) => ({ transform: trasladar(punto, origen) })),
      { duration: duracion, easing: "linear", fill: "forwards" },
    );
    nodo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, fill: "forwards" });
    const actual: Cursor = { id, objetivo, elemento, nodo, origen, en: hasta, cadena: terminada(vuelo), sinPresion: false, fuera: false };
    cursor = actual;
    window.clearTimeout(caducidad);
    caducidad = window.setTimeout(() => desvanecer(actual, false), ACTUACION.caducidadMs);
  };

  const pulsar = (objetivo: string) => {
    const elemento = resolverElementoGuia(objetivo);
    if (!elemento) return;
    const nodo = document.createElement("div");
    nodo.className = "pekito-anillo-guia";
    nodo.setAttribute("aria-hidden", "true");
    const origen = colocar(nodo, anfitrion(elemento));
    const estilo = getComputedStyle(elemento);
    nodo.style.borderTopLeftRadius = agrandarRadio(estilo.borderTopLeftRadius, ALCANCE_ANILLO_PX);
    nodo.style.borderTopRightRadius = agrandarRadio(estilo.borderTopRightRadius, ALCANCE_ANILLO_PX);
    nodo.style.borderBottomRightRadius = agrandarRadio(estilo.borderBottomRightRadius, ALCANCE_ANILLO_PX);
    nodo.style.borderBottomLeftRadius = agrandarRadio(estilo.borderBottomLeftRadius, ALCANCE_ANILLO_PX);
    let cuadro = 0;
    // Sigue al control mientras un desplazamiento lo trae a la vista.
    const seguir = () => {
      const caja = cajaAnillo(elemento.getBoundingClientRect());
      nodo.style.left = `${caja.left - origen.x}px`;
      nodo.style.top = `${caja.top - origen.y}px`;
      nodo.style.width = `${caja.width}px`;
      nodo.style.height = `${caja.height}px`;
      cuadro = requestAnimationFrame(seguir);
    };
    seguir();
    const quieto = coincide(MOVIMIENTO_REDUCIDO);
    const animacion = quieto
      ? nodo.animate([{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], {
          duration: ACTUACION.anilloQuietoMs,
          fill: "forwards",
        })
      : nodo.animate(
          [
            { opacity: 0, transform: "scale(0.96)" },
            { opacity: 1, transform: "scale(1)", offset: 0.35 },
            { opacity: 0, transform: "scale(1.03)" },
          ],
          { duration: ACTUACION.pulsoMs, easing: "ease-out", fill: "forwards" },
        );
    const detener = () => {
      cancelAnimationFrame(cuadro);
      animacion.cancel();
      nodo.remove();
      anillos.delete(detener);
    };
    anillos.add(detener);
    void terminada(animacion).then(detener);
  };

  // Cursor que vuela sólo con puntero fino y sin movimiento reducido; si no, anillo (táctil) o anillo quieto.
  const vuela = () => coincide(PUNTERO_FINO) && !coincide(MOVIMIENTO_REDUCIDO);

  const alEvento = (evento: EventoActuacion) => {
    switch (evento.tipo) {
      case "intent": {
        objetivos.set(evento.id, evento.objetivo);
        if (cursor) desvanecer(cursor, false);
        if (evento.objetivo && vuela()) volar(evento.id, evento.objetivo);
        return;
      }
      case "run": {
        if (cedidas.has(evento.id)) return;
        iniciarBorde(evento.id);
        if (cursor?.id === evento.id) {
          presionar(cursor);
          return;
        }
        const objetivo = objetivos.get(evento.id);
        if (objetivo) pulsar(objetivo);
        return;
      }
      case "done": {
        detenerBorde(evento.id);
        objetivos.delete(evento.id);
        cedidas.delete(evento.id);
        if (cursor?.id !== evento.id) return;
        desvanecer(cursor, evento.estado !== "fallida");
        return;
      }
      case "point": {
        const eco =
          (cursor && cursor.objetivo === evento.objetivo) ||
          (ultimaPresion && ultimaPresion.objetivo === evento.objetivo && performance.now() - ultimaPresion.en < ECO_MS);
        if (!eco) pulsar(evento.objetivo);
        return;
      }
    }
  };

  // La persona toma el control: cualquier toque cancela todas las señales.
  const alTocar = (evento: PointerEvent) => {
    if (!evento.isTrusted) return;
    for (const id of objetivos.keys()) cedidas.add(id);
    for (const id of [...temporizadoresBorde.keys(), ...actuando.keys()]) {
      cedidas.add(id);
      detenerBorde(id);
    }
    if (cursor) quitarCursor(cursor);
    for (const detener of [...anillos]) detener();
  };

  const dejar = suscribirActuacion(alEvento);
  window.addEventListener("pointerdown", alTocar, { capture: true, passive: true });

  return () => {
    dejar();
    window.removeEventListener("pointerdown", alTocar, { capture: true });
    for (const id of [...temporizadoresBorde.keys(), ...actuando.keys()]) detenerBorde(id);
    if (cursor) quitarCursor(cursor);
    for (const detener of [...anillos]) detener();
    window.clearTimeout(caducidad);
    borde.remove();
    raiz.removeAttribute(ATRIBUTO_ACTUANDO);
  };
}

/**
 * Capa de actuación tipo Clicky: un cursor que vuela desde Pekito hasta el control (data-guia) que
 * una acción va a operar, un anillo en pantallas táctiles y un anillo quieto con movimiento
 * reducido. Se alimenta del bus de actuación (runtime/acting-bus.ts). Se monta una sola vez.
 */
export function CapaActuacion(): null {
  useEffect(() => {
    // Sin Web Animations API (p. ej. jsdom) no hay capa visual; las acciones siguen igual.
    if (typeof Element.prototype.animate !== "function") return;
    return iniciarCapa();
  }, []);
  return null;
}
