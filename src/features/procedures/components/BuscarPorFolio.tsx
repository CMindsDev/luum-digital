import { zodResolver } from "@hookform/resolvers/zod";
import { Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { normalizarFolio, tipoDeFolio } from "@/domain/folios";
import { useProcedureByFolio } from "@/services/hooks";
import { Button, ErrorState, Field, LoadingState, TextInput } from "@/design-system";
import { TarjetaGestion } from "./TarjetaGestion";

function crearEsquema(t: (texto: string, opciones?: Record<string, unknown>) => string) {
  return z.object({
    folio: z
      .string()
      .trim()
      .min(1, t("Escribe el folio de tu gestión."))
      .refine((valor) => tipoDeFolio(valor) === "gestion", t("Escribe un folio de gestión con el formato DEMO-G-0000000.")),
  });
}

export function BuscarPorFolio() {
  const { t } = useTranslation();
  const [folio, setFolio] = useState("");
  const resultado = useProcedureByFolio(folio);
  const esquema = useMemo(() => crearEsquema(t), [t]);
  const form = useForm<z.infer<typeof esquema>>({ resolver: zodResolver(esquema), defaultValues: { folio: "" } });

  return (
    <section aria-labelledby="titulo-buscar-folio" className="rounded-tarjeta border border-borde bg-superficie p-4 shadow-suave sm:p-5">
      <h2 id="titulo-buscar-folio" className="text-lg font-semibold text-marino">
        {t("Buscar por folio")}
      </h2>
      <form
        role="search"
        aria-labelledby="titulo-buscar-folio"
        noValidate
        onSubmit={form.handleSubmit(({ folio: valor }) => setFolio(normalizarFolio(valor)))}
        className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
        data-guia="gestiones.buscar_folio"
      >
        <Field etiqueta={t("Folio de la gestión")} ayuda={t("Ejemplo: DEMO-G-0000001. Puedes escribirlo sin guiones.")} error={form.formState.errors.folio?.message} className="min-w-0 flex-1">
          <TextInput autoComplete="off" autoCapitalize="characters" placeholder="DEMO-G-0000001" {...form.register("folio")} />
        </Field>
        <Button type="submit" iconoInicio={Search} cargando={resultado.isFetching} textoCargando={t("Buscando…")}>
          {t("Buscar")}
        </Button>
      </form>

      <div aria-live="polite" className="mt-4">
        {!folio ? null : resultado.isPending ? (
          <LoadingState etiqueta={t("Buscando el folio…")} variante="compacto" />
        ) : resultado.isError ? (
          <ErrorState error={resultado.error} nivel={3} onReintentar={() => void resultado.refetch()} />
        ) : resultado.data ? (
          <TarjetaGestion gestion={resultado.data} />
        ) : (
          <p className="flex items-start gap-2 rounded-boton border border-borde bg-fondo px-4 py-3 text-tinta">
            <SearchX aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-tinta-suave" />
            {t("No encontramos la gestión {{folio}} en tu identidad de demostración.", { folio })}
          </p>
        )}
      </div>
    </section>
  );
}
