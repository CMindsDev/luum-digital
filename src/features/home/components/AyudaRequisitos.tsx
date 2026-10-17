import { ListChecks, Search } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { Button, Field, LoadingState, TextInput } from "@/design-system";
import { useProcedures } from "@/services/hooks";
import { gestionesRecientes } from "../lib/gestiones";

/**
 * Para «¿qué documentos pide este trámite?» sin un trámite abierto: pregunta cuál y ofrece los
 * requisitos de los trámites que la persona ya inició (gestiones de demostración).
 */
export function AyudaRequisitos() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const gestiones = useProcedures();
  const [tramite, setTramite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const campoRef = useRef<HTMLInputElement>(null);

  const recientes = gestiones.data ? gestionesRecientes(gestiones.data, 3) : [];
  const servicios = recientes.filter((gestion, indice) => recientes.findIndex((otra) => otra.servicioId === gestion.servicioId) === indice);

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const texto = tramite.trim();
    if (texto.length < 3) {
      setError(t("Escribe el nombre del trámite (al menos 3 letras)."));
      campoRef.current?.focus();
      return;
    }
    setError(null);
    navigate(`/buscar?q=${encodeURIComponent(`requisitos de ${texto}`)}`);
  };

  return (
    <div className="space-y-5">
      <form onSubmit={enviar} noValidate className="flex max-w-xl flex-col items-start gap-3" data-guia="busqueda.tramite_requisitos">
        <Field etiqueta={t("¿De qué trámite?")} ayuda={t("Por ejemplo «licencia de funcionamiento» o «cédula catastral».")} error={error ?? undefined} className="w-full">
          <TextInput
            ref={campoRef}
            value={tramite}
            onChange={(evento) => {
              setTramite(evento.target.value);
              if (error) setError(null);
            }}
            icono={Search}
            autoComplete="off"
            maxLength={120}
          />
        </Field>
        <Button type="submit" variante="secundario" iconoInicio={ListChecks}>
          {t("Ver sus requisitos")}
        </Button>
      </form>

      {gestiones.isPending ? <LoadingState etiqueta={t("Buscando los trámites que ya iniciaste…")} variante="compacto" /> : null}
      {servicios.length > 0 ? (
        <div>
          <h3 className="text-base font-semibold text-marino">{t("Requisitos de los trámites que ya iniciaste")}</h3>
          <ul className="mt-2 space-y-2">
            {servicios.map((gestion) => (
              <li key={gestion.servicioId}>
                <Link
                  to={`/servicios/${encodeURIComponent(gestion.servicioId)}#requisitos`}
                  className="inline-flex min-h-11 items-center gap-2 font-medium text-enlace underline underline-offset-4 hover:text-marino"
                >
                  <ListChecks aria-hidden="true" className="size-4 shrink-0" />
                  {gestion.servicioNombre}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
