import { ArrowRight } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button, Field, TextInput } from "@/design-system";
import { rutaDeFolio } from "../lib/folio";

export interface ConsultaFolioProps {
  /** Folio detectado en la consulta, si lo había. */
  valorInicial?: string;
}

/**
 * Consulta directa de un folio de demostración: lleva a «Mis reportes» (DEMO-R-…) o a «Mis
 * gestiones» (DEMO-G-…, DEMO-P-…, DEMO-C-…). Valida el formato antes de navegar.
 */
export function ConsultaFolio({ valorInicial = "" }: ConsultaFolioProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [folio, setFolio] = useState(valorInicial);
  const [error, setError] = useState<string | null>(null);
  const campoRef = useRef<HTMLInputElement>(null);

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const resultado = rutaDeFolio(folio);
    if (!resultado.ok) {
      setError(resultado.error);
      campoRef.current?.focus();
      return;
    }
    setError(null);
    navigate(resultado.ruta);
  };

  return (
    <form onSubmit={enviar} noValidate className="flex max-w-xl flex-col items-start gap-3" data-guia="busqueda.folio">
      <Field
        etiqueta={t("Tu folio de demostración")}
        ayuda={t("Por ejemplo DEMO-R-0000001 (reporte) o DEMO-G-0000001 (gestión).")}
        error={error ?? undefined}
        className="w-full"
      >
        <TextInput
          ref={campoRef}
          value={folio}
          onChange={(evento) => {
            setFolio(evento.target.value);
            if (error) setError(null);
          }}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="font-mono uppercase"
        />
      </Field>
      <Button type="submit" variante="primario" iconoFin={ArrowRight}>
        {t("Consultar folio")}
      </Button>
    </form>
  );
}
