import { BookUser } from "lucide-react";
import type { FieldValues, UseFormRegister } from "react-hook-form";
import type { CampoEscenario, OpcionCampo } from "@/components/catalogo/datos-demo";
import { Checkbox, Field, Select, TextArea, TextInput } from "@/design-system";
import { fechaMinimaCita } from "./valores";

export interface CampoEscenarioControlProps {
  campo: CampoEscenario;
  register: UseFormRegister<FieldValues>;
  error?: string;
  /** Opciones calculadas (p. ej. sedes de la ficha u horarios de ejemplo). */
  opciones?: readonly OpcionCampo[];
  /** El valor actual se copió del expediente con confirmación. */
  reutilizado?: boolean;
  /** Prefijo de id para no chocar con otros formularios en la página. */
  prefijoId: string;
}

const TIPO_INPUT: Partial<Record<CampoEscenario["tipo"], { type: string; inputMode?: "numeric" | "decimal" | "tel" | "email" }>> = {
  texto: { type: "text" },
  telefono: { type: "tel", inputMode: "tel" },
  correo: { type: "email", inputMode: "email" },
  numero: { type: "text", inputMode: "decimal" },
  fecha: { type: "date" },
};

/** Control accesible para un campo de escenario ficticio (etiqueta, ayuda y error asociados). */
export function CampoEscenarioControl({ campo, register, error, opciones, reutilizado = false, prefijoId }: CampoEscenarioControlProps) {
  const id = `${prefijoId}-${campo.nombre}`;
  const registro = register(campo.nombre);

  if (campo.tipo === "casilla") {
    return <Checkbox id={id} etiqueta={campo.etiqueta} descripcion={campo.ayuda} error={error} {...registro} />;
  }

  const ayuda = reutilizado ? (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {campo.ayuda ? <span>{campo.ayuda}</span> : null}
      <span className="inline-flex items-center gap-1 font-semibold text-exito">
        <BookUser aria-hidden="true" className="size-4" />
        Copiado de tu expediente de ejemplo
      </span>
    </span>
  ) : (
    campo.ayuda
  );

  return (
    <Field id={id} etiqueta={campo.etiqueta} ayuda={ayuda} error={error} requerido>
      {campo.tipo === "texto_largo" ? (
        <TextArea maxLength={300} rows={4} {...registro} />
      ) : campo.tipo === "seleccion" || campo.tipo === "hora" ? (
        <Select
          marcador={campo.tipo === "hora" ? "Elige un horario de ejemplo" : "Elige una opción"}
          opciones={(opciones ?? campo.opciones ?? []).map((opcion) => ({ valor: opcion.valor, etiqueta: opcion.etiqueta }))}
          {...registro}
        />
      ) : (
        <TextInput
          type={TIPO_INPUT[campo.tipo]?.type ?? "text"}
          inputMode={TIPO_INPUT[campo.tipo]?.inputMode}
          autoComplete={campo.autocompletar ?? "off"}
          placeholder={campo.marcador}
          min={campo.tipo === "fecha" ? fechaMinimaCita() : undefined}
          {...registro}
        />
      )}
    </Field>
  );
}
