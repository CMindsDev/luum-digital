import { zodResolver } from "@hookform/resolvers/zod";
import type { TFunction } from "i18next";
import type { LucideIcon } from "lucide-react";
import { useId, type FormEvent, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button, Dialog, Field, TextArea } from "@/design-system";
import { ErrorAccion } from "./ErrorAccion";

const esquemaMotivo = (t: TFunction) =>
  z.object({
    motivo: z.string().trim().min(5, t("Escribe el motivo (al menos 5 caracteres).")).max(200, t("Usa como máximo 200 caracteres.")),
  });

type Valores = z.infer<ReturnType<typeof esquemaMotivo>>;

export interface DialogoMotivoProps {
  abierto: boolean;
  titulo: string;
  descripcion: ReactNode;
  etiquetaMotivo: string;
  ayuda?: string;
  textoConfirmar: string;
  iconoConfirmar?: LucideIcon;
  /** Error de la mutación (se muestra dentro del diálogo). */
  error: unknown;
  procesando: boolean;
  guia?: string;
  onCerrar: () => void;
  /** Debe lanzar si la acción falla (el diálogo sigue abierto con el error). */
  onConfirmar: (motivo: string) => Promise<void>;
}

/** Acción del operador que exige un motivo escrito (rechazar o revertir una verificación). */
export function DialogoMotivo({
  abierto,
  titulo,
  descripcion,
  etiquetaMotivo,
  ayuda,
  textoConfirmar,
  iconoConfirmar,
  error,
  procesando,
  guia,
  onCerrar,
  onConfirmar,
}: DialogoMotivoProps) {
  const { t } = useTranslation();
  const idFormulario = `motivo-${useId().replace(/:/g, "")}`;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Valores>({ resolver: zodResolver(esquemaMotivo(t)), defaultValues: { motivo: "" } });

  const cerrar = () => {
    if (procesando) return;
    reset();
    onCerrar();
  };

  const alEnviar = (evento: FormEvent<HTMLFormElement>) => {
    void handleSubmit(async ({ motivo }) => {
      if (procesando) return;
      try {
        await onConfirmar(motivo);
        reset();
      } catch {
        // El error llega por la propiedad `error`; el formulario conserva el motivo.
      }
    })(evento);
  };

  return (
    <Dialog
      abierto={abierto}
      onCerrar={cerrar}
      titulo={titulo}
      descripcion={descripcion}
      acciones={
        <>
          <Button variante="secundario" onClick={cerrar} disabled={procesando}>
            {t("Volver")}
          </Button>
          <Button type="submit" form={idFormulario} variante="peligro" iconoInicio={iconoConfirmar} cargando={isSubmitting || procesando}>
            {textoConfirmar}
          </Button>
        </>
      }
    >
      <form id={idFormulario} onSubmit={alEnviar} noValidate className="flex flex-col gap-4 pb-1">
        <Field etiqueta={etiquetaMotivo} requerido ayuda={ayuda ?? t("Entre 5 y 200 caracteres. La persona verá este motivo.")} error={errors.motivo?.message}>
          <TextArea {...register("motivo")} maxLength={200} rows={3} data-guia={guia} />
        </Field>
        <ErrorAccion error={error} />
      </form>
    </Dialog>
  );
}
