import { useCallback, useRef, useState } from "react";
import { PageHeader } from "@/design-system";
import type { MotivoApoyo } from "@/features/assistant/runtime";
import { useHelpLines } from "@/services/hooks";
import { Acompanante } from "../components/Acompanante";
import { AtencionSaludMental } from "../components/AtencionSaludMental";
import { BarraAyudaInmediata } from "../components/BarraAyudaInmediata";
import { EntradasSaludMental, type EntradaSaludMental } from "../components/EntradasSaludMental";
import { SobreEsteEspacio } from "../components/SobreEsteEspacio";
import { useAcompanante } from "../hooks/useAcompanante";
import { useSenalamiento } from "../hooks/useSenalamiento";

const ENTRADA_A_MENSAJE: Readonly<Partial<Record<EntradaSaludMental, string>>> = {
  hablar: "Quiero hablar de cómo me siento",
  apoyo_alguien: "Busco apoyo para alguien",
};

function desplazarA(elemento: HTMLElement | null, enfocar: boolean) {
  if (!elemento) return;
  const reducido = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // scrollIntoView puede no existir (p. ej. jsdom): mostrar la ayuda nunca debe fallar por desplazar.
  elemento.scrollIntoView?.({ block: "start", behavior: reducido ? "auto" : "smooth" });
  if (enfocar) elemento.focus({ preventScroll: true });
}

/**
 * /bienestar/salud-mental. Ayuda inmediata siempre visible (no espera a ninguna conversación),
 * cuatro entradas, acompañante opcional de demostración (ámbito «bienestar», sólo en memoria) y
 * dónde hay atención. Sin persistencia, notificaciones, analítica ni datos en la URL.
 */
export default function MentalHealthPage() {
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const [alertaRiesgo, setAlertaRiesgo] = useState<MotivoApoyo | null>(null);
  const lineas = useHelpLines();
  const atencionRef = useRef<HTMLHeadingElement>(null);
  const acompananteRef = useRef<HTMLTextAreaElement>(null);
  useSenalamiento("salud_mental.");

  const abrirApoyoHumano = useCallback((motivo: MotivoApoyo) => {
    if (motivo === "orientacion") {
      desplazarA(atencionRef.current, false);
      return;
    }
    setAlertaRiesgo(motivo);
    setAyudaAbierta(true);
  }, []);

  const acompanante = useAcompanante({ abrirApoyoHumano, lineas: lineas.data });

  const elegirEntrada = (entrada: EntradaSaludMental) => {
    if (entrada === "ayuda_inmediata") {
      setAyudaAbierta(true);
      return;
    }
    if (entrada === "encontrar_atencion") {
      desplazarA(atencionRef.current, true);
      return;
    }
    const mensaje = ENTRADA_A_MENSAJE[entrada];
    desplazarA(acompananteRef.current?.closest("section") ?? null, false);
    acompananteRef.current?.focus({ preventScroll: true });
    if (mensaje) void acompanante.enviar(mensaje);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        antetitulo="Bienestar"
        titulo="Salud mental"
        regresar="/bienestar"
        descripcion="Un espacio para orientarte y encontrar atención. Si estás en peligro, usa «Ayuda inmediata»: no tienes que conversar primero."
      />

      <BarraAyudaInmediata abierta={ayudaAbierta} onCambiar={setAyudaAbierta} />

      <div className="space-y-10">
        <section aria-labelledby="que-necesitas" className="space-y-3">
          <h2 id="que-necesitas" className="text-xl font-semibold text-marino sm:text-2xl">
            ¿Qué necesitas?
          </h2>
          <EntradasSaludMental onElegir={elegirEntrada} />
        </section>

        <Acompanante
          acompanante={acompanante}
          alertaRiesgo={alertaRiesgo}
          onAbrirAyuda={() => setAyudaAbierta(true)}
          onDescartarAlerta={() => setAlertaRiesgo(null)}
          compositorRef={acompananteRef}
        />

        <AtencionSaludMental tituloRef={atencionRef} />

        <SobreEsteEspacio />
      </div>
    </div>
  );
}
