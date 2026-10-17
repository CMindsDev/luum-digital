import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Sheet } from "@/design-system";
import { PekitoMascota } from "./ui/PekitoMascota";
import { PekitoOnboarding } from "./ui/PekitoOnboarding";
import { leerPreferenciasPekito } from "./ui/pekito-preferencias";
import "./ui/pekito.css";

/**
 * Punto de montaje del asistente global (Pekito) en el AppShell.
 * Publica --espacio-asistente para que el contenido nunca quede debajo del botón flotante.
 *
 * Etapa actual: botón flotante + bienvenida (Figma 22:67). El chat y la voz se conectan al
 * runtime del asistente (src/features/assistant/runtime y providers) en la etapa de módulos;
 * mientras tanto el panel ofrece accesos directos reales a los recorridos.
 */
const ESPACIO_ASISTENTE = "5.5rem";

const ACCESOS = [
  { etiqueta: "Quiero reportar un bache", ruta: "/reportes/nuevo/bache" },
  { etiqueta: "Requisitos de un trámite", ruta: "/servicios" },
  { etiqueta: "Consultar mi folio", ruta: "/gestiones" },
  { etiqueta: "Busco apoyo psicológico", ruta: "/bienestar/salud-mental" },
  { etiqueta: "Ver el mapa de la ciudad", ruta: "/mapa" },
] as const;

export function AssistantMount() {
  const [bienvenidaAbierta, setBienvenidaAbierta] = useState(false);
  const [panelAbierto, setPanelAbierto] = useState(false);

  useEffect(() => {
    const raiz = document.documentElement;
    raiz.style.setProperty("--espacio-asistente", ESPACIO_ASISTENTE);
    return () => {
      raiz.style.removeProperty("--espacio-asistente");
    };
  }, []);

  const abrir = () => {
    if (leerPreferenciasPekito().bienvenidaVista) setPanelAbierto(true);
    else setBienvenidaAbierta(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        data-guia="asistente.abrir"
        aria-label="Abrir Pekito, asistente de demostración"
        className="pekito fixed right-4 bottom-[calc(var(--altura-nav-inferior)+1rem)] z-40 flex min-h-14 items-center gap-2 rounded-full border-2 border-[var(--pekito-acento)] bg-[var(--pekito-fondo)] py-1.5 pr-4 pl-2 text-[var(--pekito-tinta)] shadow-flotante transition-transform hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        <PekitoMascota ancho={44} />
        <span className="pekito-marca text-sm">Pekito</span>
      </button>

      <PekitoOnboarding
        abierto={bienvenidaAbierta}
        onCerrar={() => {
          setBienvenidaAbierta(false);
          setPanelAbierto(true);
        }}
      />

      <Sheet
        abierto={panelAbierto}
        onCerrar={() => setPanelAbierto(false)}
        titulo="Pekito"
        descripcion="Asistente de demostración. La conversación por texto y voz se está conectando; mientras, te llevo directo:"
      >
        <div className="pekito space-y-4">
          <PekitoMascota ancho={96} className="mx-auto" />
          <ul className="space-y-2">
            {ACCESOS.map((acceso) => (
              <li key={acceso.ruta}>
                <Link
                  to={acceso.ruta}
                  onClick={() => setPanelAbierto(false)}
                  className="flex min-h-12 items-center rounded-[21px] border border-borde bg-superficie px-4 font-medium hover:border-[var(--pekito-acento)] focus-visible:outline-3 focus-visible:outline-foco"
                >
                  {acceso.etiqueta}
                </Link>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              setPanelAbierto(false);
              setBienvenidaAbierta(true);
            }}
            className="min-h-11 text-sm text-tinta-suave underline underline-offset-2"
          >
            Ver la bienvenida otra vez
          </button>
        </div>
      </Sheet>
    </>
  );
}
