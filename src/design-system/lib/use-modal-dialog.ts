import { useCallback, useEffect, useRef, type KeyboardEvent, type MouseEvent, type RefObject } from "react";

const SELECTOR_ENFOCABLES = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "summary",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/** Elementos enfocables con Tab dentro de un contenedor (sin depender de la maquetación). */
export function obtenerEnfocables(contenedor: HTMLElement): HTMLElement[] {
  return Array.from(contenedor.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLES)).filter(
    (elemento) =>
      !elemento.closest("[hidden], [inert], [aria-hidden='true']") &&
      elemento.getAttribute("tabindex") !== "-1",
  );
}

// Bloqueo de desplazamiento del documento compartido por diálogos anidados.
let dialogosAbiertos = 0;
let overflowPrevio = "";

function bloquearDesplazamiento() {
  if (dialogosAbiertos === 0) {
    overflowPrevio = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
  }
  dialogosAbiertos += 1;
}

function liberarDesplazamiento() {
  dialogosAbiertos = Math.max(0, dialogosAbiertos - 1);
  if (dialogosAbiertos === 0) document.documentElement.style.overflow = overflowPrevio;
}

interface OpcionesDialogo {
  abierto: boolean;
  onCerrar: () => void;
  /** Elemento que recibe el foco al abrir (p. ej. el título). Si no, el propio diálogo. */
  enfocarAlAbrir?: RefObject<HTMLElement | null>;
  /** Cerrar al tocar el fondo oscurecido. */
  cerrarAlTocarFondo?: boolean;
}

/**
 * Lógica compartida de Dialog, ConfirmDialog y Sheet sobre el elemento <dialog> nativo:
 * showModal(), foco al abrir, Escape (evento cancel), foco atrapado con Tab y devolución del foco
 * al elemento que lo abrió.
 */
export function useModalDialog({ abierto, onCerrar, enfocarAlAbrir, cerrarAlTocarFondo = true }: OpcionesDialogo) {
  const dialogoRef = useRef<HTMLDialogElement>(null);
  const retornoRef = useRef<HTMLElement | null>(null);
  const onCerrarRef = useRef(onCerrar);
  const abiertoRef = useRef(abierto);

  useEffect(() => {
    onCerrarRef.current = onCerrar;
    abiertoRef.current = abierto;
  });

  useEffect(() => {
    const dialogo = dialogoRef.current;
    if (!dialogo || !abierto) return;

    retornoRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialogo.open) {
      if (typeof dialogo.showModal === "function") dialogo.showModal();
      else dialogo.setAttribute("open", "");
    }
    bloquearDesplazamiento();
    (enfocarAlAbrir?.current ?? dialogo).focus();

    return () => {
      if (dialogo.open) {
        if (typeof dialogo.close === "function") dialogo.close();
        else dialogo.removeAttribute("open");
      }
      liberarDesplazamiento();
      const destino = retornoRef.current;
      retornoRef.current = null;
      if (destino?.isConnected) destino.focus();
    };
  }, [abierto, enfocarAlAbrir]);

  useEffect(() => {
    const dialogo = dialogoRef.current;
    if (!dialogo) return;
    // Escape: el navegador emite «cancel»; el estado lo controla quien abre el diálogo.
    const alCancelar = (evento: Event) => {
      evento.preventDefault();
      onCerrarRef.current();
    };
    // Cierre por otros medios (p. ej. <form method="dialog">): sincroniza el estado.
    const alCerrar = () => {
      // Un close pendiente del cleanup de StrictMode no debe cerrar un diálogo reabierto.
      if (abiertoRef.current && !dialogo.open) onCerrarRef.current();
    };
    dialogo.addEventListener("cancel", alCancelar);
    dialogo.addEventListener("close", alCerrar);
    return () => {
      dialogo.removeEventListener("cancel", alCancelar);
      dialogo.removeEventListener("close", alCerrar);
    };
  }, []);

  const manejarTeclado = useCallback((evento: KeyboardEvent<HTMLDialogElement>) => {
    const dialogo = dialogoRef.current;
    if (!dialogo) return;
    if (evento.key === "Escape") {
      // Respaldo para entornos sin evento «cancel».
      evento.preventDefault();
      evento.stopPropagation();
      onCerrarRef.current();
      return;
    }
    if (evento.key !== "Tab") return;
    const enfocables = obtenerEnfocables(dialogo);
    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];
    if (!primero || !ultimo) {
      evento.preventDefault();
      return;
    }
    const activo = document.activeElement;
    const dentro = activo instanceof HTMLElement && enfocables.includes(activo);
    if (evento.shiftKey && (activo === primero || !dentro)) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && (activo === ultimo || !dentro)) {
      evento.preventDefault();
      primero.focus();
    }
  }, []);

  const manejarClic = useCallback(
    (evento: MouseEvent<HTMLDialogElement>) => {
      // Un clic cuyo destino es el propio <dialog> sólo puede venir del fondo (::backdrop).
      if (cerrarAlTocarFondo && evento.target === dialogoRef.current) onCerrarRef.current();
    },
    [cerrarAlTocarFondo],
  );

  return { dialogoRef, manejarTeclado, manejarClic };
}
