import { zodResolver } from "@hookform/resolvers/zod";
import type { TFunction } from "i18next";
import { CircleX } from "lucide-react";
import { useId, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button, Dialog, Field, Select } from "@/design-system";
import { msg } from "@/i18n";
import { useCancelReport } from "@/services/hooks";
import type { MotivoCancelacion, Reporte } from "@/types";
import { ErrorAccion } from "./ErrorAccion";

const ETIQUETA_MOTIVO: Record<MotivoCancelacion, string> = {
  duplicado: msg("Duplicado"),
  no_procede: msg("No procede"),
  fuera_de_competencia: msg("Fuera de competencia municipal"),
  informacion_insuficiente: msg("Información insuficiente"),
};

const MOTIVOS = Object.keys(ETIQUETA_MOTIVO) as MotivoCancelacion[];

const esquemaCancelacion = (t: TFunction) =>
  z.object({
    motivo: z.enum(["duplicado", "no_procede", "fuera_de_competencia", "informacion_insuficiente"], {
      error: t("Elige el motivo de cancelación."),
    }),
  });

type ValoresEntrada = z.input<ReturnType<typeof esquemaCancelacion>>;
type ValoresSalida = z.output<ReturnType<typeof esquemaCancelacion>>;

export interface DialogoCancelacionProps {
  reporte: Reporte | null;
  onCerrar: () => void;
  onHecho: (reporte: Reporte) => void;
}

/** Cancelar un reporte siempre con motivo; sus puntos pendientes se cancelan y los aprobados se revierten. */
export function DialogoCancelacion({ reporte, onCerrar, onHecho }: DialogoCancelacionProps) {
  const { t } = useTranslation();
  const idFormulario = `cancelacion-${useId().replace(/:/g, "")}`;
  const cancelar = useCancelReport();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ValoresEntrada, unknown, ValoresSalida>({ resolver: zodResolver(esquemaCancelacion(t)) });

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
      titulo={reporte ? t("Cancelar {{folio}}", { folio: reporte.folio }) : t("Cancelar reporte")}
      descripcion={t(
        "La cancelación siempre lleva motivo. Los puntos pendientes de quien reportó se cancelan y los ya aprobados se revierten con este motivo.",
      )}
      acciones={
        <>
          <Button variante="secundario" onClick={cerrar} disabled={cancelar.isPending}>
            {t("Volver")}
          </Button>
          <Button
            type="submit"
            form={idFormulario}
            variante="peligro"
            iconoInicio={CircleX}
            cargando={isSubmitting || cancelar.isPending}
            textoCargando={t("Cancelando…")}
          >
            {t("Cancelar reporte")}
          </Button>
        </>
      }
    >
      <form id={idFormulario} onSubmit={alEnviar} noValidate className="flex flex-col gap-4 pb-1">
        <Field etiqueta={t("Motivo de cancelación")} requerido error={errors.motivo?.message}>
          <Select
            {...register("motivo")}
            marcador={t("Elige un motivo")}
            opciones={MOTIVOS.map((motivo) => ({ valor: motivo, etiqueta: t(ETIQUETA_MOTIVO[motivo]) }))}
            data-guia="operador.motivo_cancelacion"
          />
        </Field>
        <ErrorAccion error={cancelar.error} />
      </form>
    </Dialog>
  );
}
