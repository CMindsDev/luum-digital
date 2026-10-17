import { Footprints, HeartHandshake, LayoutGrid, ListChecks, Megaphone, MessagesSquare } from "lucide-react";
import { useState } from "react";
import { AyudaInmediata } from "@/components/ayuda/AyudaInmediata";
import { Checkbox } from "@/design-system";
import { AvisoPendiente } from "../components/AvisoPendiente";
import { ListaCanales } from "../components/ListaCanales";
import { ReferenciaOficial } from "../components/ReferenciaOficial";
import { SeccionFicha } from "../components/SeccionFicha";
import { SeccionPasos } from "../components/SeccionPasos";
import { nombreModulo, rutaEnOtroModulo } from "../lib/modulos";
import { PuenteModulo } from "./PuenteModulo";
import type { FlowProps } from "./tipos";

/**
 * Recorrido «informativo»: ayuda a preparar la gestión (lista de requisitos para marcar, pasos y
 * canales verificados). No envía nada. Si el servicio tiene su propia sección (p. ej. Bienestar),
 * lleva ahí.
 */
export function InformationalFlow({ servicio }: FlowProps) {
  const [listos, setListos] = useState<ReadonlySet<number>>(() => new Set());
  const enOtroModulo = rutaEnOtroModulo(servicio.rutaInterna);
  // Salud mental y Línea Mujer: la ayuda humana inmediata siempre a la vista (sin completar nada).
  const enfoqueAyuda = servicio.rutaInterna.startsWith("/bienestar/salud-mental")
    ? "salud_mental"
    : servicio.rutaInterna.startsWith("/bienestar/linea-mujer")
      ? "violencia"
      : null;

  const alternar = (indice: number, marcado: boolean) =>
    setListos((actuales) => {
      const siguientes = new Set(actuales);
      if (marcado) siguientes.add(indice);
      else siguientes.delete(indice);
      return siguientes;
    });

  return (
    <div className="flex flex-col gap-5">
      {enOtroModulo ? (
        <PuenteModulo
          icono={servicio.rutaInterna.startsWith("/bienestar") ? HeartHandshake : servicio.rutaInterna.startsWith("/reportes") ? Megaphone : LayoutGrid}
          titulo={`Este servicio está en ${nombreModulo(servicio.rutaInterna)}`}
          descripcion="Ahí encuentras la información completa y sus canales, dentro de la misma app."
          ruta={servicio.rutaInterna}
          textoBoton={`Ir a ${nombreModulo(servicio.rutaInterna)}`}
          guia="servicios.ir_modulo"
        >
          {enfoqueAyuda ? <AyudaInmediata enfoque={enfoqueAyuda} /> : null}
        </PuenteModulo>
      ) : null}

      <SeccionFicha
        id="preparar"
        titulo="Prepara tu gestión"
        icono={ListChecks}
        descripcion="Marca lo que ya tienes. Esta lista es sólo para ti: no se guarda ni se envía."
      >
        {servicio.requisitos === null ? (
          <AvisoPendiente que="la lista de requisitos" />
        ) : servicio.requisitos.length === 0 ? (
          <p className="text-tinta">La fuente no publica requisitos para este servicio.</p>
        ) : (
          <fieldset>
            <legend className="sr-only">Requisitos que ya tienes</legend>
            <div className="flex flex-col divide-y divide-borde">
              {servicio.requisitos.map((requisito, indice) => (
                <Checkbox
                  key={`${requisito.nombre}-${indice}`}
                  etiqueta={requisito.nombre}
                  descripcion={[requisito.presentacion, requisito.descripcion].filter(Boolean).join(" · ") || undefined}
                  checked={listos.has(indice)}
                  onChange={(evento) => alternar(indice, evento.target.checked)}
                  className="py-1"
                />
              ))}
            </div>
            <p aria-live="polite" className="mt-3 text-sm font-semibold text-tinta">
              Tienes {listos.size} de {servicio.requisitos.length} requisitos.
            </p>
          </fieldset>
        )}
      </SeccionFicha>

      <SeccionFicha id="como-hacerlo" titulo="Cómo hacerlo" icono={Footprints}>
        {servicio.modalidadOficial ? (
          <p className="mb-4 text-tinta">
            Modalidad publicada: <strong className="font-semibold">{servicio.modalidadOficial}</strong>
          </p>
        ) : null}
        <SeccionPasos pasos={servicio.pasos} />
      </SeccionFicha>

      <SeccionFicha id="donde" titulo="Dónde te atienden" icono={MessagesSquare}>
        {servicio.canalesDeAtencion.length > 0 ? (
          <ListaCanales canales={servicio.canalesDeAtencion} />
        ) : (
          <AvisoPendiente que="los canales de atención" />
        )}
      </SeccionFicha>

      <ReferenciaOficial servicio={servicio} />
    </div>
  );
}
