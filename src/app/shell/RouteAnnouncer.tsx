import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";

const SUFIJO_TITULO = "Servicios digitales de Mérida (prototipo)";

/**
 * Rutas de apoyo confidencial: el título de la pestaña (visible en el historial, en pantallas
 * compartidas y al cambiar de app) no revela la sección. El anuncio para lectores de pantalla sí
 * dice el título, porque es efímero y sólo lo escucha la persona.
 */
const RUTAS_CONFIDENCIALES = ["/bienestar/salud-mental", "/bienestar/linea-mujer"];

function esRutaConfidencial(pathname: string): boolean {
  return RUTAS_CONFIDENCIALES.some((ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`));
}

function enfocar(elemento: HTMLElement) {
  if (!elemento.hasAttribute("tabindex")) elemento.setAttribute("tabindex", "-1");
  elemento.focus({ preventScroll: true });
}

/**
 * Gestión de foco al cambiar de ruta: espera al h1 de la nueva pantalla (las rutas cargan en
 * diferido), le mueve el foco, actualiza document.title y anuncia el título en una región viva.
 * Si la URL trae un ancla (#acerca), enfoca y desplaza a ese elemento.
 */
export function RouteAnnouncer() {
  const { pathname, hash } = useLocation();
  const [anuncio, setAnuncio] = useState("");
  const esPrimeraCarga = useRef(true);
  const h1Anterior = useRef<Element | null>(null);

  useEffect(() => {
    let cancelado = false;
    let intentos = 0;
    let temporizador = 0;
    const primera = esPrimeraCarga.current;

    const buscar = () => {
      if (cancelado) return;
      const h1 = document.querySelector<HTMLElement>("#contenido h1");
      const listo = h1?.textContent?.trim() && (primera || h1 !== h1Anterior.current || intentos >= 10);
      if (!h1 || !listo) {
        intentos += 1;
        if (intentos < 80) temporizador = window.setTimeout(buscar, 50);
        else esPrimeraCarga.current = false;
        return;
      }
      const titulo = h1.textContent?.trim() ?? "";
      h1Anterior.current = h1;
      esPrimeraCarga.current = false;
      document.title = esRutaConfidencial(pathname) ? SUFIJO_TITULO : `${titulo} · ${SUFIJO_TITULO}`;

      const ancla = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
      if (ancla) {
        enfocar(ancla);
        ancla.scrollIntoView({ block: "start" });
      } else if (!primera) {
        enfocar(h1);
      }
      if (!primera) setAnuncio(titulo);
    };

    temporizador = window.setTimeout(buscar, 0);
    return () => {
      cancelado = true;
      window.clearTimeout(temporizador);
    };
  }, [pathname, hash]);

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {anuncio}
    </div>
  );
}
