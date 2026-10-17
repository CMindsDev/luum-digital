import { DemoTag, IntegrationBadge, PageHeader } from "@/design-system";
import { AvisoCuentaDemo } from "../components/AvisoCuentaDemo";
import { DatosReutilizablesSection } from "../components/DatosReutilizablesSection";
import { DocumentosSection } from "../components/DocumentosSection";
import { GestionesRelacionadasSection } from "../components/GestionesRelacionadasSection";
import { NotificacionesRecientesSection } from "../components/NotificacionesRecientesSection";
import { PerfilSection } from "../components/PerfilSection";
import { PrivacidadSection } from "../components/PrivacidadSection";
import { PruebaReutilizacionSection } from "../components/PruebaReutilizacionSection";

/**
 * /expediente — Expediente Digital de ejemplo (brief §9): perfil ficticio, documentos de ejemplo,
 * datos reutilizables con confirmación, gestiones relacionadas, notificaciones y privacidad.
 * Es la cuenta de demostración compartida: no hay autenticación municipal.
 */
export default function ExpedientePage() {
  return (
    <>
      <PageHeader
        destacado
        antetitulo="Expediente Digital"
        titulo="Mi expediente"
        descripcion="Tu perfil, tus documentos de ejemplo y los datos que puedes reutilizar en trámites, siempre con tu confirmación."
      >
        <div className="flex flex-wrap items-center gap-2">
          <DemoTag>Expediente ficticio</DemoTag>
          <IntegrationBadge estado="simulada" />
        </div>
      </PageHeader>

      <AvisoCuentaDemo />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,23rem)]">
        <div className="flex min-w-0 flex-col gap-5">
          <PerfilSection />
          <DocumentosSection />
          <DatosReutilizablesSection />
          <PruebaReutilizacionSection />
          <GestionesRelacionadasSection />
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <PrivacidadSection />
          <NotificacionesRecientesSection />
        </div>
      </div>
    </>
  );
}
