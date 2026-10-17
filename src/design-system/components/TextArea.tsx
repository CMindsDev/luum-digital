import { useCallback, useId, useRef, useState, type ChangeEvent, type Ref, type TextareaHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";
import { unirIds, useCampo } from "../lib/campo";
import { cx } from "../lib/cx";
import { CLASES_CONTROL } from "./TextInput";

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Muestra el contador «n / máximo» (requiere maxLength). Por omisión, sí si hay maxLength. */
  contador?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
}

function asignarRef<T>(ref: Ref<T> | undefined, valor: T | null) {
  if (!ref) return;
  if (typeof ref === "function") ref(valor);
  else ref.current = valor;
}

/** Área de texto con contador de caracteres asociado (aria-describedby). Compatible con register(). */
export function TextArea({
  contador,
  maxLength,
  className,
  id,
  rows = 4,
  onChange,
  value,
  defaultValue,
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid,
  required,
  ref,
  ...resto
}: TextAreaProps) {
  const { t } = useTranslation();
  const idContador = `contador-${useId().replace(/:/g, "")}`;
  const mostrarContador = (contador ?? true) && typeof maxLength === "number";
  const campo = useCampo({
    id,
    describedBy: unirIds(describedBy, mostrarContador && idContador),
    invalido: ariaInvalid === true || ariaInvalid === "true" ? true : undefined,
    requerido: required,
  });
  const [largoInterno, setLargoInterno] = useState(() => String(defaultValue ?? "").length);
  const elementoRef = useRef<HTMLTextAreaElement | null>(null);
  const largo = value !== undefined ? String(value).length : largoInterno;

  const refCombinada = useCallback(
    (elemento: HTMLTextAreaElement | null) => {
      elementoRef.current = elemento;
      // Con register() el valor inicial lo pone React Hook Form en el elemento.
      if (elemento) setLargoInterno(elemento.value.length);
      asignarRef(ref, elemento);
    },
    [ref],
  );

  const alCambiar = (evento: ChangeEvent<HTMLTextAreaElement>) => {
    setLargoInterno(evento.target.value.length);
    onChange?.(evento);
  };

  const cerca = mostrarContador && maxLength !== undefined && largo >= maxLength * 0.9;
  return (
    <div>
      <textarea
        ref={refCombinada}
        rows={rows}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        onChange={alCambiar}
        required={required}
        {...campo}
        {...resto}
        className={cx(CLASES_CONTROL, "min-h-28 resize-y py-3 leading-relaxed", className)}
      />
      {mostrarContador ? (
        <p id={idContador} className={cx("mt-1 text-right text-sm", cerca ? "font-semibold text-aviso" : "text-tinta-suave")}>
          {largo} / {maxLength} <span className="sr-only">{t("caracteres")}</span>
        </p>
      ) : null}
    </div>
  );
}
