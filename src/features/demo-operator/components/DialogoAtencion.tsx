import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck } from "lucide-react";
import { useId, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Dialog, Field, TextArea } from "@/design-system";
import { useRegisterAttention } from "@/services/hooks";
import type { Reporte } from "@/types";
import { ErrorAccion } from "./ErrorAccion";

const MAXIMO_NOTA = 200;
const esquema = z.object({ nota: z.string().trim().max(MAXIMO_NOTA, `Usa como máximo ${MAXIMO_NOTA} caracteres.`) });
type Valores = z.infer<typeof esquema>;

export interface DialogoAtencionProps {
  reporte: Reporte | null;
  onCerrar: () => void;
  onHecho: (reporte: Reporte) => void;
}

/**
 * Registrar atención: «En proceso de atención» → «Solucionado» (atención reportada por el
 * Ayuntamiento, simulada). Abre la verificación ciudadana; no significa que alguien lo comprobó.
 */
export function DialogoAtencion({ reporte, onCerrar, onHecho }: DialogoAtencionProps) {
  const idFormulario = `atencion-${useId().replace(/:/g, "")}`;
  const atender = useRegisterAttention();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Valores>({ resolver: zodResolver(esquema), defaultValues: { nota: "" } });

  const cerrar = () => {
    if (atender.isPending) return;
    atender.reset();
    reset();
    onCerrar();
  };

  const alEnviar = (evento: FormEvent<HTMLFormElement>) => {
    void handleSubmit(async ({ nota }) => {
      if (!reporte || atender.isPending) return;
      try {
        const actualizado = await atender.mutateAsync({ reporteId: reporte.id, nota });
        atender.reset();
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
      titulo={reporte ? `Registrar atención de ${reporte.folio}` : "Registrar atención"}
      descripcion="El reporte pasará a «Solucionado» (atención reportada). Esto abre la verificación ciudadana; no significa que alguien ya comprobó la reparación."
      acciones={
        <>
          <Button variante="secundario" onClick={cerrar} disabled={atender.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form={idFormulario} variante="exito" iconoInicio={CircleCheck} cargando={isSubmitting || atender.isPending} textoCargando="Registrando…">
            Registrar atención
          </Button>
        </>
      }
    >
      <form id={idFormulario} onSubmit={alEnviar} noValidate className="flex flex-col gap-4 pb-1">
        <Field etiqueta="Nota de atención" opcional ayuda="Qué se hizo, en pocas palabras. Es una nota simulada; no escribas datos personales." error={errors.nota?.message}>
          <TextArea {...register("nota")} maxLength={MAXIMO_NOTA} rows={3} data-guia="operador.nota_atencion" />
        </Field>
        <ErrorAccion error={atender.error} />
      </form>
    </Dialog>
  );
}
