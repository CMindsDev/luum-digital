import { ChevronRight, FlaskConical } from "lucide-react";
import { ServiceCard } from "@/components/catalogo/ServiceCard";
import { ButtonLink, Card, DemoTag, ErrorState, LoadingState } from "@/design-system";
import { useServices } from "@/services/hooks";
import type { Servicio } from "@/types";
import { EncabezadoSeccion } from "./EncabezadoSeccion";
import { PracticaReutilizacion } from "./PracticaReutilizacion";

const MAXIMO_TRAMITES = 3;

/** Escenario genérico de solicitud en línea: reutiliza nombre, correo y teléfono. */
const ESCENARIO_GENERICO = "solicitud-en-linea-demo";

function sugerencias(servicios: readonly Servicio[]): Servicio[] {
  const genericos = servicios.filter((servicio) => !servicio.recorridoDemoId || servicio.recorridoDemoId === ESCENARIO_GENERICO);
  return (genericos.length > 0 ? genericos : servicios).slice(0, MAXIMO_TRAMITES);
}

/** Práctica de reutilización sin envío y trámites con formulario simulado donde usar los datos. */
export function PruebaReutilizacionSection() {
  const tramites = useServices({ tipoDeRecorrido: "formulario" });
  const lista = tramites.data ? sugerencias(tramites.data) : [];

  return (
    <Card as="section" id="prueba-reutilizacion" aria-labelledby="titulo-prueba" relleno="lg" data-guia="expediente.prueba_reutilizacion">
      <EncabezadoSeccion
        id="titulo-prueba"
        icono={FlaskConical}
        rotulo="Práctica"
        titulo="Pruébalo sin enviar nada"
        descripcion="Así se ve un formulario cuando copias datos de tu expediente."
        extra={<DemoTag>Sin envío</DemoTag>}
      />

      <PracticaReutilizacion />

      <h3 className="mt-7 text-lg font-semibold text-marino">Úsalo en un trámite</h3>
      <p className="mt-1 text-[0.9375rem] text-tinta-suave">
        Estos trámites tienen un formulario simulado con «Usar datos de mi expediente».
      </p>

      {tramites.isPending ? <LoadingState etiqueta="Buscando trámites con formulario…" variante="compacto" className="mt-3" /> : null}

      {tramites.isError ? (
        <ErrorState error={tramites.error} nivel={3} titulo="No pudimos cargar los trámites" onReintentar={() => void tramites.refetch()} className="mt-3" />
      ) : null}

      {tramites.isSuccess && lista.length === 0 ? (
        <p className="mt-3 text-tinta">Por ahora el catálogo no tiene trámites con formulario simulado.</p>
      ) : null}

      {lista.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2.5" data-guia="expediente.tramites_con_formulario">
          {lista.map((servicio) => (
            <li key={servicio.id}>
              <ServiceCard servicio={servicio} compacta />
            </li>
          ))}
        </ul>
      ) : null}

      <ButtonLink to="/servicios" variante="fantasma" tamano="sm" iconoFin={ChevronRight} className="mt-3">
        Ver todos los trámites
      </ButtonLink>
    </Card>
  );
}
