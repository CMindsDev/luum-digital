import { PageHeader } from "@/design-system";
import { AboutSection } from "../components/AboutSection";
import { DemoControlsSection } from "../components/DemoControlsSection";
import { IdentitySection } from "../components/IdentitySection";
import { ResetSection } from "../components/ResetSection";

/** /cuenta — Cuenta de demostración: identidad ficticia, controles, restablecer y limitaciones. */
export default function AccountPage() {
  return (
    <>
      <PageHeader
        destacado
        antetitulo="Demostración"
        titulo="Cuenta de demostración"
        descripcion="Elige una identidad ficticia, ajusta los controles de la demo y conoce qué hace y qué no hace este prototipo."
      />
      <div className="flex flex-col gap-5">
        <IdentitySection />
        <DemoControlsSection />
        <ResetSection />
        <AboutSection />
      </div>
    </>
  );
}
