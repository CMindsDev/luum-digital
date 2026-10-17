import { BookUser, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge, Card, ErrorState, KeyValueList, LoadingState } from "@/design-system";
import { msg } from "@/i18n";
import { useReusableFields } from "@/services/hooks";
import { EncabezadoSeccion } from "./EncabezadoSeccion";

const PASOS = [
  {
    titulo: msg("Lo pides tú"),
    texto: msg("En un trámite con formulario, toca «Usar datos de mi expediente». Nunca se llena solo."),
  },
  {
    titulo: msg("Confirmas campo por campo"),
    texto: msg("Marca uno por uno los datos que quieres copiar. Nada viene marcado y puedes cancelar."),
  },
  {
    titulo: msg("Revisas antes de enviar"),
    texto: msg("Cada dato copiado se marca «De tu expediente» y puedes cambiarlo antes de enviar la solicitud simulada."),
  },
] as const;

/** Datos del perfil ficticio que pueden reutilizarse y cómo se piden (siempre con confirmación). */
export function DatosReutilizablesSection() {
  const { t } = useTranslation();
  const reutilizables = useReusableFields();

  return (
    <Card as="section" id="datos-reutilizables" aria-labelledby="titulo-reutilizables" relleno="lg" data-guia="expediente.datos_reutilizables">
      <EncabezadoSeccion
        id="titulo-reutilizables"
        icono={BookUser}
        rotulo={t("Reutilizar datos")}
        titulo={t("Datos que puedes reutilizar")}
        descripcion={t("Puedes copiarlos a un formulario de trámite para no escribirlos otra vez, sólo si tú lo confirmas.")}
        extra={
          <Badge tono="exito" icono={ShieldCheck}>
            {t("Confirmación siempre activa")}
          </Badge>
        }
      />

      {reutilizables.isPending ? <LoadingState etiqueta={t("Cargando los datos reutilizables…")} variante="compacto" /> : null}

      {reutilizables.isError ? (
        <ErrorState
          error={reutilizables.error}
          nivel={3}
          titulo={t("No pudimos cargar los datos reutilizables")}
          onReintentar={() => void reutilizables.refetch()}
        />
      ) : null}

      {reutilizables.isSuccess ? (
        <KeyValueList
          className="rounded-boton border border-borde p-4"
          items={reutilizables.data.map((dato) => ({ id: dato.campo, clave: t(dato.etiqueta), valor: dato.valor }))}
        />
      ) : null}

      <h3 className="mt-6 text-lg font-semibold text-marino">{t("Cómo se piden")}</h3>
      <ol className="mt-3 grid gap-3 md:grid-cols-3">
        {PASOS.map((paso, indice) => (
          <li key={paso.titulo} className="flex gap-3 rounded-boton bg-superficie-2 p-4 md:flex-col">
            <span
              aria-hidden="true"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-marino font-mono-rotulo text-sm font-semibold text-white"
            >
              {indice + 1}
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-tinta">{t(paso.titulo)}</span>
              <span className="mt-0.5 block text-sm text-tinta-suave">{t(paso.texto)}</span>
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
