import { Megaphone, SearchX } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router";
import { esCategoriaReporte } from "@/domain/reportes";
import { ButtonLink, DemoTag, EmptyState, IntegrationBadge, PageHeader } from "@/design-system";
import type { CategoriaReporte } from "@/types";
import { AvisoAsistente } from "../components/nuevo/AvisoAsistente";
import { NuevoReporte } from "../components/nuevo/NuevoReporte";
import { leerPrefillReporte } from "../lib/prefill";
import { tituloNuevoReporte } from "../lib/tipos-reporte";

/** /reportes/nuevo/:categoria — «Bache a la vista» y los demás tipos del catálogo de reportes. */
export default function NewReportPage() {
  const { categoria: parametro = "" } = useParams();
  const location = useLocation();
  const prefillCrudo = useMemo(() => leerPrefillReporte(location.state), [location.state]);
  const [eleccion, setEleccion] = useState<{ parametro: string; categoria: CategoriaReporte } | null>(null);
  const alCambiarCategoria = useCallback((categoria: CategoriaReporte) => setEleccion({ parametro, categoria }), [parametro]);

  if (!esCategoriaReporte(parametro)) {
    return (
      <>
        <PageHeader titulo="Tipo de reporte no encontrado" regresar="/reportes" />
        <EmptyState
          icono={SearchX}
          titulo="No conocemos ese tipo de reporte"
          descripcion="Elige uno de los reportes rápidos o del catálogo de reportes."
          accion={
            <ButtonLink to="/reportes" iconoInicio={Megaphone}>
              Ver tipos de reporte
            </ButtonLink>
          }
        />
      </>
    );
  }

  const prefill = prefillCrudo && prefillCrudo.categoria === parametro ? prefillCrudo : null;
  const categoria = eleccion?.parametro === parametro ? eleccion.categoria : parametro;
  const { titulo, rapido } = tituloNuevoReporte(categoria);

  return (
    <>
      <PageHeader
        titulo={titulo}
        antetitulo={rapido ? "Reporte rápido" : "Catálogo de reportes"}
        regresar="/reportes"
        descripcion="Describe el problema, confirma dónde está y revisa si alguien ya lo reportó."
      >
        <div className="flex flex-wrap gap-2">
          <IntegrationBadge estado="simulada" />
          <DemoTag>Folio DEMO</DemoTag>
        </div>
      </PageHeader>
      {prefill ? <AvisoAsistente /> : null}
      <NuevoReporte key={parametro} categoria={parametro} prefill={prefill} onCambiarCategoria={alCambiarCategoria} />
    </>
  );
}
