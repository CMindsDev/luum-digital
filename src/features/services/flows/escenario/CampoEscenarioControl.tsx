import { BookUser } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FieldValues, UseFormRegister } from "react-hook-form";
import type { CampoEscenario, OpcionCampo } from "@/components/catalogo/datos-demo";
import { Checkbox, Field, Select, TextArea, TextInput } from "@/design-system";
import { fechaMinimaCita } from "./valores";

export interface CampoEscenarioControlProps {
  campo: CampoEscenario;
  register: UseFormRegister<FieldValues>;
  error?: string;
  opciones?: readonly OpcionCampo[];
  reutilizado?: boolean;
  prefijoId: string;
}

const TIPO_INPUT: Partial<Record<CampoEscenario["tipo"], { type: string; inputMode?: "numeric" | "decimal" | "tel" | "email" }>> = {
  texto: { type: "text" },
  telefono: { type: "tel", inputMode: "tel" },
  correo: { type: "email", inputMode: "email" },
  numero: { type: "text", inputMode: "decimal" },
  fecha: { type: "date" },
};

export function CampoEscenarioControl({ campo, register, error, opciones, reutilizado = false, prefijoId }: CampoEscenarioControlProps) {
  const { t } = useTranslation();
  const id = `${prefijoId}-${campo.nombre}`;
  const registro = register(campo.nombre);

  if (campo.tipo === "casilla") {
    return <Checkbox id={id} etiqueta={t(campo.etiqueta)} descripcion={campo.ayuda ? t(campo.ayuda) : undefined} error={error} {...registro} />;
  }

  const ayuda = reutilizado ? (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {campo.ayuda ? <span>{t(campo.ayuda)}</span> : null}
      <span className="inline-flex items-center gap-1 font-semibold text-exito">
        <BookUser aria-hidden="true" className="size-4" />
        {t("Copiado de tu expediente de ejemplo")}
      </span>
    </span>
  ) : campo.ayuda ? t(campo.ayuda) : undefined;

  return (
    <Field id={id} etiqueta={t(campo.etiqueta)} ayuda={ayuda} error={error} requerido>
      {campo.tipo === "texto_largo" ? (
        <TextArea maxLength={300} rows={4} {...registro} />
      ) : campo.tipo === "seleccion" || campo.tipo === "hora" ? (
        <Select
          marcador={campo.tipo === "hora" ? t("Elige un horario de ejemplo") : t("Elige una opción")}
          opciones={(opciones ?? campo.opciones ?? []).map((opcion) => ({ valor: opcion.valor, etiqueta: t(opcion.etiqueta) }))}
          {...registro}
        />
      ) : (
        <TextInput
          type={TIPO_INPUT[campo.tipo]?.type ?? "text"}
          inputMode={TIPO_INPUT[campo.tipo]?.inputMode}
          autoComplete={campo.autocompletar ?? "off"}
          placeholder={campo.marcador ? t(campo.marcador) : undefined}
          min={campo.tipo === "fecha" ? fechaMinimaCita() : undefined}
          {...registro}
        />
      )}
    </Field>
  );
}
