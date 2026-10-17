import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button, Field, TextInput, cx } from "@/design-system";
import { busquedaFolioSchema, type ValoresBusquedaFolio } from "../lib/mis-reportes";

export interface BuscarFolioFormProps {
  valorInicial?: string;
  onBuscar: (folio: string) => void;
  className?: string;
}

/** «Buscar por folio» (como en «Mis reportes» de Mérida Móvil). Acepta DEMO-R-0000001 o sólo el número. */
export function BuscarFolioForm({ valorInicial = "", onBuscar, className }: BuscarFolioFormProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ValoresBusquedaFolio>({ resolver: zodResolver(busquedaFolioSchema), defaultValues: { folio: valorInicial } });

  return (
    <form
      role="search"
      aria-label={t("Buscar reporte por folio")}
      noValidate
      onSubmit={(evento) => void handleSubmit((valores) => onBuscar(valores.folio.trim()))(evento)}
      className={cx("flex flex-col gap-2 sm:flex-row sm:items-start", className)}
    >
      <Field etiqueta={t("Buscar por folio")} error={errors.folio?.message ? t(errors.folio.message) : undefined} className="min-w-0 flex-1">
        <TextInput
          {...register("folio")}
          icono={Search}
          placeholder={t("DEMO-R-0000001")}
          autoComplete="off"
          inputMode="text"
          maxLength={24}
          data-guia="reportes.buscar_folio"
        />
      </Field>
      <Button type="submit" variante="secundario" className="sm:mt-[1.875rem]">
        {t("Buscar")}
      </Button>
    </form>
  );
}
