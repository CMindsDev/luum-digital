import { FileSearch, FolderOpen, SearchX } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
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

export function DocumentLookupFlow({ servicio }: FlowProps) {
  const { t } = useTranslation();
  const [texto, setTexto] = useState("");
  const [alcance, setAlcance] = useState<Alcance>("regulaciones");
  const filtro: FiltroCatalogo = { ...(texto ? { texto } : {}), ...(alcance === "regulaciones" ? { categoria: "regulaciones" } : {}) };
  const resultados = useServices(filtro);

  if (rutaEnOtroModulo(servicio.rutaInterna)) {
    return (
      <div className="flex flex-col gap-5">
        <PuenteModulo
          icono={FolderOpen}
          titulo={t("Consulta tus documentos en {{modulo}}", { modulo: nombreModulo(servicio.rutaInterna) })}
          descripcion={t("Ahí ves tu perfil y tus documentos de ejemplo (marcados «DOCUMENTO DE EJEMPLO»). Nunca se piden documentos reales.")}
          ruta={servicio.rutaInterna}
          textoBoton={t("Ir a {{modulo}}", { modulo: nombreModulo(servicio.rutaInterna) })}
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
          {t("Consulta de regulaciones y documentos")}
        </h2>
        <p className="mb-4 text-[0.9375rem] text-tinta-suave">
          {t("Busca en las fichas del catálogo. Cada resultado indica su fuente y si su información está verificada.")}
        </p>
        {servicio.notas ? <p className="mb-4 text-sm text-tinta">{servicio.notas}</p> : null}
        <div className="flex flex-col gap-4">
          <BuscadorCatalogo
            etiqueta={t("¿Qué regulación o tema buscas?")}
            marcador={t("p. ej. «reglamento», «transparencia», «datos personales»")}
            onBuscar={setTexto}
            guia="servicios.buscar_documentos"
          />
          <SegmentedControl<Alcance>
            etiqueta={t("Dónde buscar")}
            valor={alcance}
            onCambiar={setAlcance}
            opciones={[
              { valor: "regulaciones", etiqueta: t("Regulaciones y transparencia") },
              { valor: "todo", etiqueta: t("Todo el catálogo") },
            ]}
          />
        </div>
      </Card>

      <section aria-labelledby="titulo-documentos">
        <h2 id="titulo-documentos" className="mb-3 text-lg font-semibold text-marino">
          {texto ? t("Resultados para «{{texto}}»", { texto }) : t("Fichas relacionadas")}
        </h2>
        {resultados.isPending ? (
          <LoadingState etiqueta={t("Buscando documentos…")} variante="tarjetas" />
        ) : resultados.isError ? (
          <ErrorState error={resultados.error} onReintentar={() => void resultados.refetch()} />
        ) : resultados.data.length === 0 ? (
          <EmptyState
            icono={SearchX}
            titulo={t("No encontramos documentos con esa búsqueda")}
            descripcion={t("Prueba con otras palabras o busca en todo el catálogo. Para el texto vigente de una regulación, consulta la fuente oficial.")}
          />
        ) : (
          <ListaServicios key={`${alcance}-${texto}`} servicios={resultados.data} etiqueta={t("Documentos y regulaciones")} compacta porPagina={12} />
        )}
      </section>

      <Card as="aside" aria-label={t("Estado de esta consulta")} relleno="md" tono="suave">
        <EstadosServicio servicio={servicio} />
      </Card>
      <ReferenciaOficial servicio={servicio} />
    </div>
  );
}
