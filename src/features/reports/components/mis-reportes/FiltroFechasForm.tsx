import { zodResolver } from "@hookform/resolvers/zod";
import { Funnel } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button, Field, TextInput } from "@/design-system";
import { filtroFechasSchema, type ValoresFiltroFechas } from "../../lib/mis-reportes";

export interface FiltroFechasFormProps {
  desde: string;
  hasta: string;
  onFiltrar: (valores: ValoresFiltroFechas) => void;
}

/** «Fecha inicio», «Fecha fin» y «Filtrar resultados» (Mis reportes de Mérida Móvil). */
export function FiltroFechasForm({ desde, hasta, onFiltrar }: FiltroFechasFormProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ValoresFiltroFechas>({ resolver: zodResolver(filtroFechasSchema), values: { desde, hasta } });

  return (
    <form
      noValidate
      aria-label={t("Filtrar por fecha")}
      data-formulario={t("Filtrar mis reportes")}
      onSubmit={(evento) => void handleSubmit(onFiltrar)(evento)}
      className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-start"
    >
      <Field etiqueta={t("Fecha inicio")} error={errors.desde?.message ? t(errors.desde.message) : undefined}>
        <TextInput type="date" {...register("desde")} data-guia="reportes.fecha_inicio" />
      </Field>
      <Field etiqueta={t("Fecha fin")} error={errors.hasta?.message ? t(errors.hasta.message) : undefined}>
        <TextInput type="date" {...register("hasta")} data-guia="reportes.fecha_fin" />
      </Field>
      <Button type="submit" iconoInicio={Funnel} className="sm:mt-[1.875rem]" data-guia="reportes.filtrar">
        {t("Filtrar resultados")}
      </Button>
    </form>
  );
}
