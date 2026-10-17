import { FileSearch, FolderOpen, SearchX } from "lucide-react";
import { useState } from "react";
import { EstadosServicio } from "@/components/catalogo";
import { useServices } from "@/services/hooks";
import { Card, EmptyState, ErrorState, LoadingState, SegmentedControl } from "@/design-system";
import type { FiltroCatalogo } from "@/types";
import { BuscadorCatalogo } from "../components/BuscadorCatalogo";
import { ListaServicios } from "../components/ListaServicios";
import { ReferenciaOficial } from "../components/ReferenciaOficial";
import { nombreModulo, rutaEnOtroModulo } from "../lib/modulos";
import { PuenteModulo } from "./PuenteModulo";
import type { FlowProps } from "./tipos";

type Alcance = "regulaciones" | "todo";

/**
 * Recorrido «consulta documental»: busca regulaciones y documentos relacionados en el catálogo
 * integrado, cada resultado con su fuente. El texto vigente de cada regulación está en la fuente
 * oficial (el prototipo no copió el registro completo).
 */
export function DocumentLookupFlow({ servicio }: FlowProps) {
  const [texto, setTexto] = useState("");
  const [alcance, setAlcance] = useState<Alcance>("regulaciones");
  const filtro: FiltroCatalogo = { ...(texto ? { texto } : {}), ...(alcance === "regulaciones" ? { categoria: "regulaciones" } : {}) };
  const resultados = useServices(filtro);

  if (rutaEnOtroModulo(servicio.rutaInterna)) {
    return (
      <div className="flex flex-col gap-5">
        <PuenteModulo
          icono={FolderOpen}
          titulo={`Consulta tus documentos en ${nombreModulo(servicio.rutaInterna)}`}
          descripcion="Ahí ves tu perfil y tus documentos de ejemplo (marcados «DOCUMENTO DE EJEMPLO»). Nunca se piden documentos reales."
          ruta={servicio.rutaInterna}
          textoBoton={`Ir a ${nombreModulo(servicio.rutaInterna)}`}
          guia="servicios.ir_modulo"
        />
        <ReferenciaOficial servicio={servicio} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Card as="section" aria-labelledby="titulo-consulta" relleno="lg">
        <h2 id="titulo-consulta" className="mb-1 flex items-center gap-2 text-xl font-semibold text-marino">
          <FileSearch aria-hidden="true" className="size-6 text-azul" />
          Consulta de regulaciones y documentos
        </h2>
        <p className="mb-4 text-[0.9375rem] text-tinta-suave">
          Busca en las fichas del catálogo. Cada resultado indica su fuente y si su información está verificada.
        </p>
        {servicio.notas ? <p className="mb-4 text-sm text-tinta">{servicio.notas}</p> : null}
        <div className="flex flex-col gap-4">
          <BuscadorCatalogo
            etiqueta="¿Qué regulación o tema buscas?"
            marcador="p. ej. «reglamento», «transparencia», «datos personales»"
            onBuscar={setTexto}
            guia="servicios.buscar_documentos"
          />
          <SegmentedControl<Alcance>
            etiqueta="Dónde buscar"
            valor={alcance}
            onCambiar={setAlcance}
            opciones={[
              { valor: "regulaciones", etiqueta: "Regulaciones y transparencia" },
              { valor: "todo", etiqueta: "Todo el catálogo" },
            ]}
          />
        </div>
      </Card>

      <section aria-labelledby="titulo-documentos">
        <h2 id="titulo-documentos" className="mb-3 text-lg font-semibold text-marino">
          {texto ? `Resultados para «${texto}»` : "Fichas relacionadas"}
        </h2>
        {resultados.isPending ? (
          <LoadingState etiqueta="Buscando documentos…" variante="tarjetas" />
        ) : resultados.isError ? (
          <ErrorState error={resultados.error} onReintentar={() => void resultados.refetch()} />
        ) : resultados.data.length === 0 ? (
          <EmptyState
            icono={SearchX}
            titulo="No encontramos documentos con esa búsqueda"
            descripcion="Prueba con otras palabras o busca en todo el catálogo. Para el texto vigente de una regulación, consulta la fuente oficial."
          />
        ) : (
          <ListaServicios key={`${alcance}-${texto}`} servicios={resultados.data} etiqueta="Documentos y regulaciones" compacta porPagina={12} />
        )}
      </section>

      <Card as="aside" aria-label="Estado de esta consulta" relleno="md" tono="suave">
        <EstadosServicio servicio={servicio} />
      </Card>
      <ReferenciaOficial servicio={servicio} />
    </div>
  );
}
