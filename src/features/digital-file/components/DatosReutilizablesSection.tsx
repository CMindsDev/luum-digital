import { BookUser, ShieldCheck } from "lucide-react";
import { Badge, Card, ErrorState, KeyValueList, LoadingState } from "@/design-system";
import { useReusableFields } from "@/services/hooks";
import { EncabezadoSeccion } from "./EncabezadoSeccion";

const PASOS = [
  {
    titulo: "Lo pides tú",
    texto: "En un trámite con formulario, toca «Usar datos de mi expediente». Nunca se llena solo.",
  },
  {
    titulo: "Confirmas campo por campo",
    texto: "Marca uno por uno los datos que quieres copiar. Nada viene marcado y puedes cancelar.",
  },
  {
    titulo: "Revisas antes de enviar",
    texto: "Cada dato copiado se marca «De tu expediente» y puedes cambiarlo antes de enviar la solicitud simulada.",
  },
] as const;

/** Datos del perfil ficticio que pueden reutilizarse y cómo se piden (siempre con confirmación). */
export function DatosReutilizablesSection() {
  const reutilizables = useReusableFields();

  return (
    <Card as="section" id="datos-reutilizables" aria-labelledby="titulo-reutilizables" relleno="lg" data-guia="expediente.datos_reutilizables">
      <EncabezadoSeccion
        id="titulo-reutilizables"
        icono={BookUser}
        rotulo="Reutilizar datos"
        titulo="Datos que puedes reutilizar"
        descripcion="Puedes copiarlos a un formulario de trámite para no escribirlos otra vez, sólo si tú lo confirmas."
        extra={
          <Badge tono="exito" icono={ShieldCheck}>
            Confirmación siempre activa
          </Badge>
        }
      />

      {reutilizables.isPending ? <LoadingState etiqueta="Cargando los datos reutilizables…" variante="compacto" /> : null}

      {reutilizables.isError ? (
        <ErrorState
          error={reutilizables.error}
          nivel={3}
          titulo="No pudimos cargar los datos reutilizables"
          onReintentar={() => void reutilizables.refetch()}
        />
      ) : null}

      {reutilizables.isSuccess ? (
        <KeyValueList
          className="rounded-boton border border-borde p-4"
          items={reutilizables.data.map((dato) => ({ id: dato.campo, clave: dato.etiqueta, valor: dato.valor }))}
        />
      ) : null}

      <h3 className="mt-6 text-lg font-semibold text-marino">Cómo se piden</h3>
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
              <span className="block font-semibold text-tinta">{paso.titulo}</span>
              <span className="mt-0.5 block text-sm text-tinta-suave">{paso.texto}</span>
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
