import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch, type FieldValues } from "react-hook-form";
import type { EscenarioDemo } from "@/components/catalogo/datos-demo";
import type { Gestion } from "@/types";
import { reutilizadosVigentes, valoresIniciales } from "./valores";

/**
 * Formulario de un escenario ficticio con React Hook Form + Zod (esquema del escenario) y el registro
 * de los datos copiados del expediente con confirmación.
 */
export function useFormularioEscenario(escenario: EscenarioDemo, borrador: Gestion | null) {
  const form = useForm<FieldValues>({
    resolver: zodResolver(escenario.esquema),
    defaultValues: valoresIniciales(escenario.campos, borrador?.datos),
    shouldFocusError: true,
  });
  // Campos copiados del expediente: nombre → valor copiado. Un borrador conserva los suyos.
  const [copiados, setCopiados] = useState<Record<string, string>>(() => {
    const iniciales: Record<string, string> = {};
    for (const nombre of borrador?.camposReutilizados ?? []) {
      const valor = borrador?.datos[nombre];
      if (typeof valor === "string") iniciales[nombre] = valor;
    }
    return iniciales;
  });
  const valores = useWatch({ control: form.control });
  const reutilizados = reutilizadosVigentes(copiados, valores);

  /** Copia al formulario sólo los datos que la persona confirmó (campo por campo). */
  const aplicarReutilizados = (seleccion: Record<string, string>) => {
    for (const [nombre, valor] of Object.entries(seleccion)) {
      form.setValue(nombre, valor, { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
    }
    setCopiados((actuales) => ({ ...actuales, ...seleccion }));
  };

  return { form, reutilizados, aplicarReutilizados };
}

export type FormularioEscenario = ReturnType<typeof useFormularioEscenario>;
