import { useRef } from "react";
import { useTranslation } from "react-i18next";
import type { EscenarioDemo, OpcionCampo } from "@/components/catalogo/datos-demo";
import { msg } from "@/i18n";
import { useRequestAppointment } from "@/services/hooks";
import type { CitaDemo } from "@/types";
import { CargadorEscenario } from "./escenario/CargadorEscenario";
import { SolicitudSimulada } from "./escenario/SolicitudSimulada";
import type { FlowProps } from "./tipos";

const SEDE_POR_CONFIRMAR = msg("Sede por confirmar en la ficha oficial");

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

export function AppointmentFlow({ servicio }: FlowProps) {
  const { t } = useTranslation();
  const solicitar = useRequestAppointment();
  const ultima = useRef<{ clave: string; cita: CitaDemo } | null>(null);

  function opcionesDeCita(escenario: EscenarioDemo): Record<string, readonly OpcionCampo[]> {
    const sedes = servicio.canalesDeAtencion
      .filter((canal) => canal.tipo === "presencial" && canal.verificado)
      .map((canal) => ({ valor: canal.valor, etiqueta: canal.valor }));
    return {
      sede: sedes.length > 0 ? sedes : [{ valor: SEDE_POR_CONFIRMAR, etiqueta: t(SEDE_POR_CONFIRMAR) }],
      hora: (escenario.horariosEjemplo ?? []).map((hora) => ({ valor: hora, etiqueta: t("{{hora}} h (horario de ejemplo)", { hora }) })),
    };
  }

  return (
    <CargadorEscenario servicio={servicio}>
      {(escenario, borrador) => (
        <SolicitudSimulada
          servicio={servicio}
          escenario={escenario}
          borrador={borrador}
          opciones={opcionesDeCita(escenario)}
          pasos={[t("Datos y horario"), t("Revisión"), t("Solicitud simulada")]}
          textoEnviar={t("Enviar solicitud de cita simulada")}
          avisoRevision={
            <>
              <strong className="font-semibold">{t("No es una cita confirmada.")}</strong>{" "}
              {t("Es una solicitud de demostración: nadie la recibe y no reserva ningún lugar. Para una cita real, usa los canales oficiales de la ficha.")}
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
