import { Ban, LockKeyhole, WifiOff } from "lucide-react";
import { useSinConexion } from "@/app/hooks/useSinConexion";
import { Card, ErrorState, LoadingState, notificar, Switch } from "@/design-system";
import { usePrivacy, useUpdatePrivacy } from "@/services/hooks";
import { PREFERENCIAS_EDITABLES, type PreferenciaEditable } from "../lib/privacidad";
import { EncabezadoSeccion } from "./EncabezadoSeccion";

const NUNCA_EN_EL_EXPEDIENTE = [
  "CURP, INE ni comprobantes reales.",
  "Contraseñas ni datos bancarios: los pagos siempre son simulados.",
  "Conversaciones de Bienestar: nunca se guardan ni forman parte de tu expediente.",
] as const;

/**
 * Preferencias de privacidad de la demostración. La confirmación antes de reutilizar datos
 * siempre está activa y no se puede apagar.
 */
export function PrivacidadSection() {
  const privacidad = usePrivacy();
  const actualizar = useUpdatePrivacy();
  const sinConexion = useSinConexion();

  const cambiar = (clave: PreferenciaEditable, valor: boolean) => {
    actualizar.mutate(
      { [clave]: valor },
      {
        onSuccess: () => notificar({ tono: "exito", titulo: "Preferencia guardada", descripcion: "Se guarda sólo en este navegador." }),
      },
    );
  };

  return (
    <Card as="section" id="privacidad" aria-labelledby="titulo-privacidad" relleno="md" data-guia="expediente.privacidad">
      <EncabezadoSeccion
        id="titulo-privacidad"
        icono={LockKeyhole}
        rotulo="Privacidad"
        titulo="Privacidad"
        descripcion="Decide cómo se usan tus datos ficticios en la demostración."
      />

      {privacidad.isPending ? <LoadingState etiqueta="Cargando tus preferencias…" variante="compacto" /> : null}

      {privacidad.isError ? (
        <ErrorState
          error={privacidad.error}
          nivel={3}
          titulo="No pudimos cargar tus preferencias"
          onReintentar={() => void privacidad.refetch()}
        />
      ) : null}

      {privacidad.isSuccess ? (
        <div className="flex flex-col gap-4">
          {sinConexion ? (
            <p className="flex items-start gap-2 rounded-boton border border-ambar bg-aviso-suave px-3 py-2.5 text-sm text-tinta">
              <WifiOff aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-aviso" />
              Sin conexión: puedes consultar tus preferencias, pero no cambiarlas hasta que vuelva la conexión.
            </p>
          ) : null}

          <div className="flex flex-col divide-y divide-borde">
            <Switch
              className="pb-4"
              activado={privacidad.data.confirmarAntesDeReutilizar}
              onCambiar={() => undefined}
              deshabilitado
              etiqueta="Pedir confirmación antes de reutilizar mis datos"
              descripcion="Siempre activa: ningún dato de tu expediente se copia a un formulario sin que lo marques y confirmes."
              guia="expediente.privacidad_confirmacion"
            />
            {PREFERENCIAS_EDITABLES.map((preferencia) => (
              <Switch
                key={preferencia.clave}
                className="py-4 last:pb-0"
                activado={privacidad.data[preferencia.clave]}
                onCambiar={(valor) => cambiar(preferencia.clave, valor)}
                deshabilitado={sinConexion || actualizar.isPending}
                etiqueta={preferencia.etiqueta}
                descripcion={preferencia.descripcion}
                guia={preferencia.guia}
              />
            ))}
          </div>

          <p role="status" className="min-h-5 text-sm text-tinta-suave">
            {actualizar.isPending ? "Guardando tu preferencia…" : ""}
          </p>

          {actualizar.isError ? (
            <ErrorState error={actualizar.error} nivel={3} titulo="No se guardó el cambio" />
          ) : null}

          <div className="rounded-boton bg-superficie-2 p-4">
            <h3 className="text-base font-semibold text-marino">Lo que nunca está en tu expediente</h3>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm text-tinta">
              {NUNCA_EN_EL_EXPEDIENTE.map((texto) => (
                <li key={texto} className="flex items-start gap-2">
                  <Ban aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-tinta-suave" />
                  {texto}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
