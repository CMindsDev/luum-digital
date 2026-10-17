import { useCallback, useEffect, useRef, type KeyboardEvent, type RefObject } from "react";
import { obtenerEnfocables } from "@/design-system/lib/use-modal-dialog";

interface OpcionesPanel {
  abierto: boolean;
  /** true: <dialog> modal (teléfono y tableta). false: tarjeta no modal (escritorio). */
  modal: boolean;
  onCerrar: () => void;
  /** Elemento que recibe el foco al abrir. Si no, el propio diálogo. */
  enfocarAlAbrir?: RefObject<HTMLElement | null>;
  /** Dónde devolver el foco al cerrar si el elemento que abrió ya no existe. */
  retornoRespaldo?: RefObject<HTMLElement | null>;
}

/**
 * Panel de Pekito sobre el <dialog> nativo, modal o no modal:
 * - modal: showModal(), foco atrapado con Tab, sin desplazamiento del documento;
 * - no modal: show(), la página sigue usable;
 * - ambos: foco al abrir, Escape cierra y el foco vuelve a quien lo abrió (sin robárselo a la
 *   pantalla si, mientras tanto, otra pantalla tomó el foco).
 */
export function usePanelDialogo({ abierto, modal, onCerrar, enfocarAlAbrir, retornoRespaldo }: OpcionesPanel) {
  const dialogoRef = useRef<HTMLDialogElement>(null);
  const retornoRef = useRef<HTMLElement | null>(null);
  const onCerrarRef = useRef(onCerrar);
  const yaAbierto = useRef(false);
  const bloqueo = useRef<{ overflowPrevio: string } | null>(null);

  useEffect(() => {
    onCerrarRef.current = onCerrar;
  });

  useEffect(() => {
    const dialogo = dialogoRef.current;
    if (!dialogo) return;
    const raiz = document.documentElement;
    const liberar = () => {
      if (!bloqueo.current) return;
      raiz.style.overflow = bloqueo.current.overflowPrevio;
      bloqueo.current = null;
    };

    if (abierto) {
      const primeraVez = !yaAbierto.current;
      if (primeraVez) {
        const activo = document.activeElement;
        retornoRef.current = activo instanceof HTMLElement && activo !== document.body ? activo : null;
      }
      // Abrir (o cambiar de modal a no modal al cruzar el punto de quiebre).
      if (dialogo.open) dialogo.close();
      if (modal && typeof dialogo.showModal === "function") dialogo.showModal();
      else if (typeof dialogo.show === "function") dialogo.show();
      else dialogo.setAttribute("open", "");
      if (modal && !bloqueo.current) {
        bloqueo.current = { overflowPrevio: raiz.style.overflow };
        raiz.style.overflow = "hidden";
      } else if (!modal) liberar();
      const enfocar = () => (enfocarAlAbrir?.current ?? dialogo).focus();
      // Cerrar y volver a mostrar el <dialog> (también en el doble efecto de StrictMode) devuelve el foco
      // al elemento anterior y show() lo pasa al primer control: siempre se reubica en el título.
      enfocar();
      yaAbierto.current = true;
      // Otro diálogo que se cierra a la vez (la bienvenida) puede devolver el foco a la mascota un instante después.
      const reintento = window.setTimeout(() => {
        // Sólo si el foco se fue a otra parte de la página (nunca le quita el foco a quien ya está escribiendo).
        if (primeraVez && !dialogo.contains(document.activeElement)) enfocar();
      }, 120);
      return () => window.clearTimeout(reintento);
    }

    if (!yaAbierto.current) return;
    yaAbierto.current = false;
    const teniaFoco = dialogo.contains(document.activeElement);
    if (dialogo.open) {
      if (typeof dialogo.close === "function") dialogo.close();
      else dialogo.removeAttribute("open");
    }
    liberar();
    const destino = retornoRef.current?.isConnected ? retornoRef.current : retornoRespaldo?.current;
    retornoRef.current = null;
    const libre = document.activeElement === document.body || document.activeElement === null;
    // No se le roba el foco a una pantalla que lo tomó mientras tanto (p. ej. el h1 de una ruta nueva).
    if ((teniaFoco || libre) && destino?.isConnected) destino.focus();
  }, [abierto, modal, enfocarAlAbrir, retornoRespaldo]);

  // Al desmontar, nunca deja el documento sin desplazamiento.
  useEffect(
    () => () => {
      if (bloqueo.current) document.documentElement.style.overflow = bloqueo.current.overflowPrevio;
      bloqueo.current = null;
    },
    [],
  );

  useEffect(() => {
    const dialogo = dialogoRef.current;
    if (!dialogo) return;
    const alCancelar = (evento: Event) => {
      evento.preventDefault();
      onCerrarRef.current();
    };
    dialogo.addEventListener("cancel", alCancelar);
    return () => dialogo.removeEventListener("cancel", alCancelar);
  }, []);

  const manejarTeclado = useCallback(
    (evento: KeyboardEvent<HTMLDialogElement>) => {
      const dialogo = dialogoRef.current;
      if (!dialogo) return;
      if (evento.key === "Escape") {
        evento.preventDefault();
        evento.stopPropagation();
        onCerrarRef.current();
        return;
      }
      if (!modal || evento.key !== "Tab") return;
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
    },
    [modal],
  );

  return { dialogoRef, manejarTeclado };
}
