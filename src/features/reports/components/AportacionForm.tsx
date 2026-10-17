import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquarePlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DESCRIPCION_REPORTE } from "@/domain/validaciones";
import { Button, Checkbox, Field, TextArea, describirError } from "@/design-system";
import { msg } from "@/i18n";
import { useAddContribution } from "@/services/hooks";
import type { Reporte } from "@/types";
import { useTranslation } from "react-i18next";

interface ValoresAportacion {
  descripcion: string;
  tieneFoto: boolean;
}

const aportacionSchema = z.object({
  descripcion: z
    .string()
    .trim()
    .min(DESCRIPCION_REPORTE.minimo, msg("Aporta al menos 15 caracteres."))
    .max(DESCRIPCION_REPORTE.maximo, msg("Usa como máximo 300 caracteres.")),
  tieneFoto: z.boolean(),
});

export interface AportacionFormProps {
  reporte: Pick<Reporte, "id" | "folio">;
  /** Texto inicial (p. ej. la descripción que la persona ya escribió). */
  descripcionInicial?: string;
  /** Si la persona ya adjuntó una foto en el formulario de reporte. */
  tieneFotoInicial?: boolean;
  /** Muestra la casilla de foto (en el detalle no hay selector de foto). */
  mostrarCasillaFoto?: boolean;
  onAportado: (reporte: Reporte) => void;
  onCancelar?: () => void;
}

/**
 * «Es el mismo incidente: aportar información». Suma la información al reporte existente:
 * no crea un reporte nuevo ni genera puntos (así no se premian duplicados).
 */
export function AportacionForm({
  reporte,
  descripcionInicial = "",
  tieneFotoInicial = false,
  mostrarCasillaFoto = false,
  onAportado,
  onCancelar,
}: AportacionFormProps) {
  const { t } = useTranslation();
  const aportar = useAddContribution();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ValoresAportacion>({
    resolver: zodResolver(aportacionSchema),
    defaultValues: { descripcion: descripcionInicial.slice(0, DESCRIPCION_REPORTE.maximo), tieneFoto: tieneFotoInicial },
  });

  const enviar = handleSubmit(async (valores) => {
    if (aportar.isPending) return;
    try {
      const actualizado = await aportar.mutateAsync({ reporteId: reporte.id, descripcion: valores.descripcion, tieneFoto: valores.tieneFoto });
      onAportado(actualizado);
    } catch {
      // El error se muestra abajo (aportar.error); los datos escritos se conservan.
    }
  });

  return (
    <form onSubmit={(evento) => void enviar(evento)} noValidate data-formulario={t("Aportar información")} className="flex flex-col gap-4">
      <p className="text-[0.9375rem] text-tinta">
        {t("Tu información se suma al reporte")} <strong className="font-mono font-semibold">{reporte.folio}</strong>.{" "}
        {t("No se crea un reporte nuevo y las aportaciones no generan puntos.")}
      </p>
      <Field
        etiqueta={t("Información que aportas")}
        requerido
        ayuda={t("Entre {{minimo}} y {{maximo}} caracteres. Por ejemplo: sigue igual, creció, hay otro cerca…", {
          minimo: DESCRIPCION_REPORTE.minimo,
          maximo: DESCRIPCION_REPORTE.maximo,
        })}
        error={errors.descripcion?.message ? t(errors.descripcion.message) : undefined}
      >
        <TextArea {...register("descripcion")} maxLength={DESCRIPCION_REPORTE.maximo} rows={3} data-guia="reportes.aportacion_texto" />
      </Field>
      {mostrarCasillaFoto ? (
        <Checkbox
          {...register("tieneFoto")}
          etiqueta={t("Tengo una foto del lugar")}
          descripcion={t("La foto no se guarda: sólo se registra que existe.")}
        />
      ) : null}
      {aportar.error ? (
        <p role="alert" className="rounded-control border border-peligro/25 bg-peligro-suave px-3 py-2.5 text-sm text-tinta">
          <strong className="font-semibold text-peligro">{describirError(aportar.error).titulo}. </strong>
          {describirError(aportar.error).descripcion}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancelar ? (
          <Button variante="secundario" onClick={onCancelar}>
            {t("Cancelar")}
          </Button>
        ) : null}
        <Button
          type="submit"
          iconoInicio={MessageSquarePlus}
          cargando={isSubmitting || aportar.isPending}
          textoCargando={t("Enviando aportación…")}
          data-guia="reportes.enviar_aportacion"
        >
          {t("Enviar aportación")}
        </Button>
      </div>
    </form>
  );
}
