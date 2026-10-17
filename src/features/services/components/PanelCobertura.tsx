import { Database } from "lucide-react";
import { useCoverage } from "@/services/hooks";
import { Card, ErrorState, LoadingState, SectionLabel, SourceNote } from "@/design-system";

export interface PanelCoberturaProps {
  /** Total de fichas del catálogo integrado (fuente + módulos agregados), si se conoce. */
  totalCatalogo?: number;
}

function porcentaje(parte: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((parte / total) * 100);
}

/**
 * Cobertura honesta del catálogo: cuántas fichas publica la fuente, cuántas se importaron y cuántas
 * se verificaron. Nunca afirma que están «todos los servicios» del Ayuntamiento.
 */
export function PanelCobertura({ totalCatalogo }: PanelCoberturaProps) {
  const { data, isPending, isError, error, refetch } = useCoverage();

  if (isPending) return <LoadingState etiqueta="Cargando la cobertura del catálogo…" variante="compacto" />;
  if (isError) return <ErrorState error={error} nivel={3} onReintentar={() => void refetch()} />;

  const verificadas = porcentaje(data.verificados, data.totalImportado);
  const agregados = totalCatalogo !== undefined ? Math.max(totalCatalogo - data.totalImportado, 0) : null;
  const cifras = [
    { id: "fuente", valor: data.totalFuente, etiqueta: "Fichas publicadas en la fuente" },
    { id: "importadas", valor: data.totalImportado, etiqueta: "Fichas importadas" },
    { id: "verificadas", valor: data.verificados, etiqueta: "Con datos verificados" },
    { id: "pendientes", valor: data.pendientes, etiqueta: "Pendientes de verificar" },
  ];

  return (
    <Card as="section" aria-labelledby="titulo-cobertura" relleno="lg" data-guia="servicios.cobertura">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-boton bg-azul-suave text-azul">
          <Database className="size-5" />
        </span>
        <div className="min-w-0">
          <SectionLabel as="p">Cobertura del catálogo</SectionLabel>
          <h2 id="titulo-cobertura" className="mt-0.5 text-lg font-semibold text-marino">
            ¿Qué tan completo está este catálogo?
          </h2>
          <p className="mt-1 max-w-prose text-[0.9375rem] text-tinta-suave">
            Reúne las fichas que publicaba la fuente oficial en la fecha de consulta. No es la lista de todos los servicios del
            Ayuntamiento: una ficha puede faltar o cambiar.
          </p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cifras.map((cifra) => (
          <div key={cifra.id} className="rounded-boton border border-borde bg-fondo px-4 py-3">
            <dt className="text-sm text-tinta-suave">{cifra.etiqueta}</dt>
            <dd className="mt-1 text-2xl font-semibold text-marino">{cifra.valor.toLocaleString("es-MX")}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5">
        <p id="medidor-verificadas" className="text-sm font-semibold text-tinta">
          {verificadas} % de las fichas importadas tiene datos verificados
        </p>
        <div
          role="meter"
          aria-labelledby="medidor-verificadas"
          aria-valuemin={0}
          aria-valuemax={data.totalImportado}
          aria-valuenow={data.verificados}
          aria-valuetext={`${data.verificados} de ${data.totalImportado} fichas verificadas`}
          className="mt-2 h-3 overflow-hidden rounded-pildora bg-azul-suave"
        >
          <div className="h-full rounded-pildora bg-azul" style={{ width: `${verificadas}%` }} />
        </div>
        <p className="mt-2 text-sm text-tinta-suave">
          Las fichas pendientes muestran «Pendiente de verificar» en requisitos, costos y horarios que no se contrastaron.
          {data.demostracion > 0 ? ` ${data.demostracion.toLocaleString("es-MX")} fichas son de demostración.` : ""}
          {agregados ? ` Además se agregaron ${agregados} módulos de Mérida Móvil, Expediente Digital y otras fuentes oficiales, cada uno con su fuente.` : ""}
        </p>
      </div>

      <SourceNote fuente={data.fuente} className="mt-5" />
    </Card>
  );
}
