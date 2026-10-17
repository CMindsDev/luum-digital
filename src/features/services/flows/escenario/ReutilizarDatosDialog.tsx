import { useState } from "react";
import type { CampoEscenario } from "@/components/catalogo/datos-demo";
import { useReusableFields } from "@/services/hooks";
import { Button, Checkbox, Dialog, ErrorState, LoadingState } from "@/design-system";
import { camposParaReutilizar } from "./valores";

export interface ReutilizarDatosDialogProps {
  abierto: boolean;
  onCerrar: () => void;
  campos: readonly CampoEscenario[];
  /** Recibe los campos elegidos: nombre del campo del formulario → valor del expediente. */
  onConfirmar: (seleccion: Record<string, string>) => void;
}

/**
 * «Usar datos de mi expediente»: lista campo por campo lo que se copiaría y sólo copia lo que la
 * persona marca y confirma. Nada se copia por omisión. Datos ficticios del Expediente Digital de ejemplo.
 */
export function ReutilizarDatosDialog({ abierto, onCerrar, campos, onConfirmar }: ReutilizarDatosDialogProps) {
  const reutilizables = useReusableFields();
  const [elegidos, setElegidos] = useState<ReadonlySet<string>>(() => new Set());

  const opciones = reutilizables.data ? camposParaReutilizar(campos, reutilizables.data) : [];
  const disponibles = opciones.filter((opcion) => opcion.dato !== null);

  const cerrar = () => {
    setElegidos(new Set());
    onCerrar();
  };

  const confirmar = () => {
    const seleccion: Record<string, string> = {};
    for (const { campo, dato } of disponibles) {
      if (dato && elegidos.has(campo.nombre)) seleccion[campo.nombre] = dato.valor;
    }
    setElegidos(new Set());
    onConfirmar(seleccion);
  };

  const alternar = (nombre: string, marcado: boolean) =>
    setElegidos((actuales) => {
      const siguientes = new Set(actuales);
      if (marcado) siguientes.add(nombre);
      else siguientes.delete(nombre);
      return siguientes;
    });

  return (
    <Dialog
      abierto={abierto}
      onCerrar={cerrar}
      titulo="Usar datos de mi expediente"
      descripcion="Marca uno por uno los datos que quieres copiar a este formulario. Nada se copia sin tu confirmación y puedes cambiarlos después."
      acciones={
        <>
          <Button variante="secundario" onClick={cerrar}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={elegidos.size === 0} data-guia="servicios.confirmar_reutilizar">
            {elegidos.size === 0 ? "Elige al menos un dato" : `Copiar ${elegidos.size} ${elegidos.size === 1 ? "dato" : "datos"}`}
          </Button>
        </>
      }
    >
      {reutilizables.isPending ? (
        <LoadingState etiqueta="Cargando tu expediente de ejemplo…" variante="compacto" />
      ) : reutilizables.isError ? (
        <ErrorState error={reutilizables.error} nivel={3} onReintentar={() => void reutilizables.refetch()} />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-tinta-suave">
            Son datos ficticios de tu Expediente Digital de demostración. Nunca se piden CURP, INE ni comprobantes reales.
          </p>
          {disponibles.length === 0 ? (
            <p className="text-tinta">Tu expediente de ejemplo no tiene datos que sirvan para este formulario.</p>
          ) : (
            <fieldset>
              <legend className="mb-1 font-semibold text-tinta">Datos que se copiarían</legend>
              <div className="flex flex-col divide-y divide-borde">
                {disponibles.map(({ campo, dato }) => (
                  <Checkbox
                    key={campo.nombre}
                    etiqueta={campo.etiqueta}
                    descripcion={
                      <>
                        Valor en tu expediente: <span className="font-semibold text-tinta">{dato?.valor}</span>
                      </>
                    }
                    checked={elegidos.has(campo.nombre)}
                    onChange={(evento) => alternar(campo.nombre, evento.target.checked)}
                    className="py-1"
                  />
                ))}
              </div>
            </fieldset>
          )}
          {opciones.length > disponibles.length ? (
            <p className="text-sm text-tinta-suave">
              No están en tu expediente:{" "}
              {opciones
                .filter((opcion) => opcion.dato === null)
                .map((opcion) => opcion.campo.etiqueta)
                .join(", ")}
              .
            </p>
          ) : null}
        </div>
      )}
    </Dialog>
  );
}
