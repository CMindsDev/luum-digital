import { zodResolver } from "@hookform/resolvers/zod";
import { Search, SearchX } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { normalizarFolio, tipoDeFolio } from "@/domain/folios";
import { useProcedureByFolio } from "@/services/hooks";
import { Button, ErrorState, Field, LoadingState, TextInput } from "@/design-system";
import { TarjetaGestion } from "./TarjetaGestion";

const esquema = z.object({
  folio: z
    .string()
    .trim()
    .min(1, "Escribe el folio de tu gestión.")
    .refine((valor) => tipoDeFolio(valor) === "gestion", "Escribe un folio de gestión con el formato DEMO-G-0000000."),
});
type ValoresFolio = z.infer<typeof esquema>;

/** Búsqueda de una gestión simulada por su folio DEMO-G (sólo de la identidad activa). */
export function BuscarPorFolio() {
  const [folio, setFolio] = useState("");
  const resultado = useProcedureByFolio(folio);
  const form = useForm<ValoresFolio>({ resolver: zodResolver(esquema), defaultValues: { folio: "" } });

  return (
    <section aria-labelledby="titulo-buscar-folio" className="rounded-tarjeta border border-borde bg-superficie p-4 shadow-suave sm:p-5">
      <h2 id="titulo-buscar-folio" className="text-lg font-semibold text-marino">
        Buscar por folio
      </h2>
      <form
        role="search"
        aria-labelledby="titulo-buscar-folio"
        noValidate
        onSubmit={form.handleSubmit(({ folio: valor }) => setFolio(normalizarFolio(valor)))}
        className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
        data-guia="gestiones.buscar_folio"
      >
        <Field
          etiqueta="Folio de la gestión"
          ayuda="Ejemplo: DEMO-G-0000001. Puedes escribirlo sin guiones."
          error={form.formState.errors.folio?.message}
          className="min-w-0 flex-1"
        >
          <TextInput autoComplete="off" autoCapitalize="characters" placeholder="DEMO-G-0000001" {...form.register("folio")} />
        </Field>
        <Button type="submit" iconoInicio={Search} cargando={resultado.isFetching} textoCargando="Buscando…">
          Buscar
        </Button>
      </form>

      <div aria-live="polite" className="mt-4">
        {!folio ? null : resultado.isPending ? (
          <LoadingState etiqueta="Buscando el folio…" variante="compacto" />
        ) : resultado.isError ? (
          <ErrorState error={resultado.error} nivel={3} onReintentar={() => void resultado.refetch()} />
        ) : resultado.data ? (
          <TarjetaGestion gestion={resultado.data} />
        ) : (
          <p className="flex items-start gap-2 rounded-boton border border-borde bg-fondo px-4 py-3 text-tinta">
            <SearchX aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-tinta-suave" />
            No encontramos la gestión {folio} en tu identidad de demostración.
          </p>
        )}
      </div>
    </section>
  );
}
