import { Building2, ChevronDown, ExternalLink, ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Badge, Button, ErrorState, formatearFecha, LoadingState } from "@/design-system";
import { useServiceLocations } from "@/services/hooks";
import type { UbicacionServicio } from "@/types";
import { separarUbicaciones } from "../incidencias";

const ETIQUETA_TIPO: Record<UbicacionServicio["tipo"], string> = {
  salud_mental: "Atención psicológica",
  salud: "Salud",
  mujeres: "Atención a mujeres",
  atencion_ciudadana: "Atención ciudadana",
  deporte: "Deporte",
  educacion: "Educación",
};

const ORDEN_TIPOS: readonly UbicacionServicio["tipo"][] = ["salud_mental", "salud", "mujeres", "atencion_ciudadana", "deporte", "educacion"];

const VISIBLES_POR_GRUPO = 4;

function GrupoUbicaciones({ tipo, ubicaciones }: { tipo: UbicacionServicio["tipo"]; ubicaciones: UbicacionServicio[] }) {
  const [abierto, setAbierto] = useState(false);
  const idLista = `ubicaciones-${tipo}`;
  const mostradas = abierto ? ubicaciones : ubicaciones.slice(0, VISIBLES_POR_GRUPO);
  return (
    <div>
      <h3 className="mb-2 font-semibold text-tinta">
        {ETIQUETA_TIPO[tipo]} <span className="font-normal text-tinta-suave">({ubicaciones.length})</span>
      </h3>
      <ul id={idLista} className="grid gap-2 sm:grid-cols-2">
        {mostradas.map((ubicacion) => (
          <li key={ubicacion.id} className="min-w-0 rounded-boton border border-borde bg-superficie px-3 py-2.5">
            <p className="flex items-start gap-2 font-medium text-tinta">
              <Building2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-tinta-suave" />
              <span className="min-w-0 break-words">{ubicacion.nombre}</span>
            </p>
            <p className="mt-0.5 pl-6 text-sm break-words text-tinta-suave">{ubicacion.direccion}</p>
            <p className="mt-1 pl-6 text-xs text-tinta-suave">
              Fuente:{" "}
              <a href={ubicacion.fuente.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-enlace underline underline-offset-2">
                {ubicacion.fuente.nombre}
                <ExternalLink aria-hidden="true" className="size-3" />
                <span className="sr-only">(se abre en otra pestaña)</span>
              </a>{" "}
              · consultada el {formatearFecha(ubicacion.fuente.fechaConsulta, "media")}
            </p>
          </li>
        ))}
      </ul>
      {ubicaciones.length > VISIBLES_POR_GRUPO ? (
        <Button
          variante="fantasma"
          tamano="sm"
          iconoFin={ChevronDown}
          className="mt-2"
          aria-expanded={abierto}
          aria-controls={idLista}
          onClick={() => setAbierto((valor) => !valor)}
        >
          {abierto ? "Mostrar menos" : `Mostrar las ${ubicaciones.length}`}
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Ubicaciones de atención con dirección publicada en fuentes oficiales. Las que no publican
 * coordenadas no se dibujan en el mapa (no se inventan): aparecen aquí. Salud mental sólo aparece
 * como lugares de atención, nunca como demanda ni puntos de personas.
 */
export function UbicacionesAtencion() {
  const consulta = useServiceLocations();
  const { conCoordenadas, sinCoordenadas } = separarUbicaciones(consulta.data ?? []);

  let contenido: ReactNode;
  if (consulta.isPending) {
    contenido = <LoadingState etiqueta="Cargando ubicaciones…" variante="compacto" />;
  } else if (consulta.isError) {
    contenido = <ErrorState error={consulta.error} onReintentar={() => void consulta.refetch()} nivel={3} />;
  } else if (sinCoordenadas.length === 0) {
    contenido = <p className="text-sm text-tinta-suave">Todas las ubicaciones verificadas están dibujadas en el mapa.</p>;
  } else {
    contenido = (
      <div className="space-y-5">
        {ORDEN_TIPOS.map((tipo) => {
          const grupo = sinCoordenadas.filter((ubicacion) => ubicacion.tipo === tipo);
          return grupo.length > 0 ? <GrupoUbicaciones key={tipo} tipo={tipo} ubicaciones={grupo} /> : null;
        })}
      </div>
    );
  }

  return (
    <section id="ubicaciones-atencion" aria-labelledby="titulo-ubicaciones" className="scroll-mt-[calc(var(--altura-encabezado)+1rem)]">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 id="titulo-ubicaciones" className="text-lg font-semibold text-marino">
          Ubicaciones de atención verificadas
        </h2>
        <Badge tono="exito" icono={ShieldCheck}>
          Fuente oficial
        </Badge>
      </div>
      <p className="mb-4 max-w-prose text-sm text-tinta-suave">
        Sedes municipales con dirección publicada en fichas oficiales.{" "}
        {consulta.data
          ? `${conCoordenadas.length} con coordenadas publicadas (en el mapa) y ${sinCoordenadas.length} sólo con dirección: no se dibujan para no inventar su posición.`
          : null}
      </p>
      {contenido}
    </section>
  );
}
