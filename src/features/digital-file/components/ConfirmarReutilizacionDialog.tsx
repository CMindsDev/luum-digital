import { useState } from "react";
import { Button, Checkbox, Dialog, ErrorState, LoadingState } from "@/design-system";
import { useReusableFields } from "@/services/hooks";
import type { CampoReutilizable } from "@/types";

export interface CampoDestino {
  /** Nombre del campo del formulario. */
  nombre: string;
  etiqueta: string;
  /** Dato del expediente que puede copiarse en este campo. */
  reutilizable: CampoReutilizable["campo"];
}

export interface ConfirmarReutilizacionDialogProps {
  abierto: boolean;
  onCerrar: () => void;
  campos: readonly CampoDestino[];
  /** Recibe sólo los campos marcados: nombre del campo → valor del expediente. */
  onConfirmar: (seleccion: Record<string, string>) => void;
}

/**
 * Confirmación explícita campo por campo antes de copiar datos del expediente ficticio.
 * Nada viene marcado por omisión y el botón de copiar se deshabilita hasta elegir al menos uno.
 */
export function ConfirmarReutilizacionDialog({ abierto, onCerrar, campos, onConfirmar }: ConfirmarReutilizacionDialogProps) {
  const reutilizables = useReusableFields();
  const [elegidos, setElegidos] = useState<ReadonlySet<string>>(() => new Set());

  const opciones = campos.flatMap((campo) => {
    const dato = reutilizables.data?.find((item) => item.campo === campo.reutilizable);
    return dato && dato.valor.trim() !== "" && dato.valor.trim() !== "—" ? [{ campo, valor: dato.valor }] : [];
  });

  const cerrar = () => {
    setElegidos(new Set());
    onCerrar();
  };

  const confirmar = () => {
    const seleccion: Record<string, string> = {};
    for (const { campo, valor } of opciones) {
      if (elegidos.has(campo.nombre)) seleccion[campo.nombre] = valor;
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

  const total = elegidos.size;

  return (
    <Dialog
      abierto={abierto}
      onCerrar={cerrar}
      titulo="Usar datos de mi expediente"
      descripcion="Marca uno por uno los datos que quieres copiar. Nada se copia sin tu confirmación y puedes cambiarlos después."
      acciones={
        <>
          <Button variante="secundario" onClick={cerrar}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={total === 0} data-guia="expediente.confirmar_reutilizar">
            {total === 0 ? "Elige al menos un dato" : `Copiar ${total} ${total === 1 ? "dato" : "datos"}`}
          </Button>
        </>
      }
    >
      {reutilizables.isPending ? <LoadingState etiqueta="Cargando tu expediente de ejemplo…" variante="compacto" /> : null}
      {reutilizables.isError ? (
        <ErrorState error={reutilizables.error} nivel={3} onReintentar={() => void reutilizables.refetch()} />
      ) : null}
      {reutilizables.isSuccess ? (
        opciones.length === 0 ? (
          <p className="text-tinta">Tu expediente de ejemplo no tiene datos que sirvan para este formulario.</p>
        ) : (
          <fieldset>
            <legend className="mb-1 font-semibold text-tinta">Datos que se copiarían</legend>
            <div className="flex flex-col divide-y divide-borde">
              {opciones.map(({ campo, valor }) => (
                <Checkbox
                  key={campo.nombre}
                  etiqueta={campo.etiqueta}
                  descripcion={
                    <>
                      Valor en tu expediente: <span className="font-semibold break-words text-tinta">{valor}</span>
                    </>
                  }
                  checked={elegidos.has(campo.nombre)}
                  onChange={(evento) => alternar(campo.nombre, evento.target.checked)}
                  className="py-1"
                />
              ))}
            </div>
          </fieldset>
        )
      ) : null}
    </Dialog>
  );
}
