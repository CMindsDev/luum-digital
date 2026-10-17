import { zodResolver } from "@hookform/resolvers/zod";
import { CircleX } from "lucide-react";
import { useId, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Dialog, ETIQUETA_MOTIVO_CANCELACION, Field, Select } from "@/design-system";
import { useCancelReport } from "@/services/hooks";
import type { MotivoCancelacion, Reporte } from "@/types";
import { ErrorAccion } from "./ErrorAccion";

const MOTIVOS = Object.keys(ETIQUETA_MOTIVO_CANCELACION) as MotivoCancelacion[];
const esquema = z.object({
  motivo: z.enum(["duplicado", "no_procede", "fuera_de_competencia", "informacion_insuficiente"], { error: "Elige el motivo de cancelación." }),
});
type ValoresEntrada = z.input<typeof esquema>;
type ValoresSalida = z.output<typeof esquema>;

export interface DialogoCancelacionProps {
  reporte: Reporte | null;
  onCerrar: () => void;
  onHecho: (reporte: Reporte) => void;
}

/** Cancelar un reporte siempre con motivo; sus puntos pendientes se cancelan y los aprobados se revierten. */
export function DialogoCancelacion({ reporte, onCerrar, onHecho }: DialogoCancelacionProps) {
  const idFormulario = `cancelacion-${useId().replace(/:/g, "")}`;
  const cancelar = useCancelReport();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ValoresEntrada, unknown, ValoresSalida>({ resolver: zodResolver(esquema) });

  const cerrar = () => {
    if (cancelar.isPending) return;
    cancelar.reset();
    reset();
    onCerrar();
  };

  const alEnviar = (evento: FormEvent<HTMLFormElement>) => {
    void handleSubmit(async ({ motivo }) => {
      if (!reporte || cancelar.isPending) return;
      try {
        const actualizado = await cancelar.mutateAsync({ reporteId: reporte.id, motivo });
        cancelar.reset();
        reset();
        onHecho(actualizado);
      } catch {
        // El error se muestra en el diálogo; el reporte no cambia.
      }
    })(evento);
  };

  return (
    <Dialog
      abierto={reporte !== null}
      onCerrar={cerrar}
      titulo={reporte ? `Cancelar ${reporte.folio}` : "Cancelar reporte"}
      descripcion="La cancelación siempre lleva motivo. Los puntos pendientes de quien reportó se cancelan y los ya aprobados se revierten con este motivo."
      acciones={
        <>
          <Button variante="secundario" onClick={cerrar} disabled={cancelar.isPending}>
            Volver
          </Button>
          <Button type="submit" form={idFormulario} variante="peligro" iconoInicio={CircleX} cargando={isSubmitting || cancelar.isPending} textoCargando="Cancelando…">
            Cancelar reporte
          </Button>
        </>
      }
    >
      <form id={idFormulario} onSubmit={alEnviar} noValidate className="flex flex-col gap-4 pb-1">
        <Field etiqueta="Motivo de cancelación" requerido error={errors.motivo?.message}>
          <Select
            {...register("motivo")}
            marcador="Elige un motivo"
            opciones={MOTIVOS.map((motivo) => ({ valor: motivo, etiqueta: ETIQUETA_MOTIVO_CANCELACION[motivo] }))}
            data-guia="operador.motivo_cancelacion"
          />
        </Field>
        <ErrorAccion error={cancelar.error} />
      </form>
    </Dialog>
  );
}
