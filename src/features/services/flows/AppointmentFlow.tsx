import { useRef } from "react";
import type { EscenarioDemo, OpcionCampo } from "@/components/catalogo/datos-demo";
import { useRequestAppointment } from "@/services/hooks";
import type { CitaDemo, Servicio } from "@/types";
import { CargadorEscenario } from "./escenario/CargadorEscenario";
import { SolicitudSimulada } from "./escenario/SolicitudSimulada";
import type { FlowProps } from "./tipos";

/** Si la ficha no publica sedes, no se inventan: la sede queda «por confirmar» en la fuente oficial. */
const SEDE_POR_CONFIRMAR = "Sede por confirmar en la ficha oficial";

function opcionesDeCita(servicio: Servicio, escenario: EscenarioDemo): Record<string, readonly OpcionCampo[]> {
  const sedes = servicio.canalesDeAtencion
    .filter((canal) => canal.tipo === "presencial" && canal.verificado)
    .map((canal) => ({ valor: canal.valor, etiqueta: canal.valor }));
  return {
    sede: sedes.length > 0 ? sedes : [{ valor: SEDE_POR_CONFIRMAR, etiqueta: SEDE_POR_CONFIRMAR }],
    hora: (escenario.horariosEjemplo ?? []).map((hora) => ({ valor: hora, etiqueta: `${hora} h (horario de ejemplo)` })),
  };
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

/**
 * Recorrido «cita»: solicitud de cita SIMULADA con sedes publicadas en la ficha y horarios de
 * ejemplo. Nunca dice «cita confirmada»: nadie recibe la solicitud y no se reserva ningún lugar.
 */
export function AppointmentFlow({ servicio }: FlowProps) {
  const solicitar = useRequestAppointment();
  // Reintentos tras un error no crean una segunda solicitud con los mismos datos.
  const ultima = useRef<{ clave: string; cita: CitaDemo } | null>(null);

  return (
    <CargadorEscenario servicio={servicio}>
      {(escenario, borrador) => (
        <SolicitudSimulada
          servicio={servicio}
          escenario={escenario}
          borrador={borrador}
          opciones={opcionesDeCita(servicio, escenario)}
          pasos={["Datos y horario", "Revisión", "Solicitud simulada"]}
          textoEnviar="Enviar solicitud de cita simulada"
          avisoRevision={
            <>
              <strong className="font-semibold">No es una cita confirmada.</strong> Es una solicitud de demostración: nadie la recibe y no
              reserva ningún lugar. Para una cita real, usa los canales oficiales de la ficha.
            </>
          }
          prepararEnvio={async (validados) => {
            const entrada = {
              servicioId: servicio.id,
              fecha: texto(validados.fecha),
              hora: texto(validados.hora),
              sede: texto(validados.sede),
            };
            const clave = `${entrada.fecha}|${entrada.hora}|${entrada.sede}`;
            const cita = ultima.current?.clave === clave ? ultima.current.cita : await solicitar.mutateAsync(entrada);
            ultima.current = { clave, cita };
            return { referenciaCita: cita.referencia };
          }}
        />
      )}
    </CargadorEscenario>
  );
}
