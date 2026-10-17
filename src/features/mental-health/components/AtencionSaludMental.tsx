import { Info } from "lucide-react";
import type { Ref } from "react";
import { ProgramaBienestarCard } from "@/components/ayuda/ProgramaBienestarCard";
import { SolicitudSimulada } from "@/components/ayuda/SolicitudSimulada";
import { ErrorState, LoadingState } from "@/design-system";
import { usePrograms, useServiceLocations } from "@/services/hooks";

const NOTAS: Readonly<Record<string, string>> = {
  "prog-apoyo-psicologico":
    "Horarios de las sedes: pendientes de verificar (las fuentes consultadas no coinciden). Confírmalos al pedir tu cita.",
  "prog-ruta-salud-mental":
    "Dato de una nota de prensa del 12 de octubre de 2026: no implica vigencia ni publica calendario o forma de solicitarlo.",
};

export interface AtencionSaludMentalProps {
  tituloRef?: Ref<HTMLHeadingElement>;
}

/**
 * Dónde hay atención: Alma Nova (MID-BIH-007), módulos de salud (MID-BIH-016) y Ruta de la Salud
 * Mental, con sedes y fuentes (usePrograms + useServiceLocations). No son líneas de crisis. Incluye
 * la solicitud de orientación simulada, que nunca dice que alguien la recibió.
 */
export function AtencionSaludMental({ tituloRef }: AtencionSaludMentalProps) {
  const programas = usePrograms("salud_mental");
  const ubicaciones = useServiceLocations();

  return (
    <section id="donde-hay-atencion" aria-labelledby="atencion-titulo" data-guia="salud_mental.donde_hay_atencion" className="space-y-4">
      <div>
        <h2 id="atencion-titulo" ref={tituloRef} tabIndex={-1} className="text-xl font-semibold text-marino sm:text-2xl">
          Dónde hay atención
        </h2>
        <p className="mt-1 max-w-prose text-[0.9375rem] text-tinta-suave">
          Atención psicológica del Ayuntamiento. Es con cita y no son líneas de crisis: si estás en peligro, usa «Ayuda inmediata».
        </p>
      </div>

      {programas.isPending ? <LoadingState variante="tarjetas" etiqueta="Cargando lugares de atención…" /> : null}
      {programas.isError ? (
        <ErrorState error={programas.error} titulo="No se pudieron cargar los lugares de atención" onReintentar={() => void programas.refetch()} />
      ) : null}
      {programas.data ? (
        programas.data.length === 0 ? (
          <p className="flex items-start gap-2 rounded-tarjeta bg-superficie-2 px-4 py-3 text-sm text-tinta">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            No hay programas de salud mental cargados en el prototipo. «Ayuda inmediata» sigue disponible.
          </p>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {programas.data.map((programa) => (
              <li key={programa.id}>
                <ProgramaBienestarCard programa={programa} ubicaciones={ubicaciones.data ?? []} nota={NOTAS[programa.id]} />
              </li>
            ))}
          </ul>
        )
      ) : null}
      {ubicaciones.isError ? (
        <p className="text-sm text-tinta-suave">No se pudieron cargar las direcciones de las sedes; los nombres siguen disponibles.</p>
      ) : null}

      <SolicitudSimulada
        tipo="salud_mental"
        titulo="Probar una solicitud de orientación"
        descripcion="Así podría verse pedir orientación desde la app. En esta demostración no llega a nadie y no genera una cita."
        atencionReal="Para una cita real, usa los contactos oficiales de Apoyo Psicológico que aparecen arriba."
        guia="salud_mental.solicitud_simulada"
      />
    </section>
  );
}
