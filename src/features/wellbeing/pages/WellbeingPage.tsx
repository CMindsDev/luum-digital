import { useTranslation } from "react-i18next";
import { AyudaInmediata } from "@/components/ayuda/AyudaInmediata";
import { SectionLabel } from "@/design-system";
import { AccesosBienestar } from "../components/AccesosBienestar";
import { BandaSaludBienestar } from "../components/BandaSaludBienestar";
import { ProgramasBienestar } from "../components/ProgramasBienestar";

/**
 * /bienestar: sección integral con la banda «Salud y Bienestar», accesos a Salud mental y Línea
 * Mujer, ayuda inmediata y programas verificados por área. Bienestar no persiste nada ni genera
 * notificaciones.
 */
export default function WellbeingPage() {
  const { t } = useTranslation();

  return (
    <>
      <BandaSaludBienestar />

      <div className="space-y-10">
        <section aria-labelledby="bienestar-acompanamiento" className="space-y-4">
          <SectionLabel id="bienestar-acompanamiento">{t("Acompañamiento")}</SectionLabel>
          <AccesosBienestar />
        </section>

        <AyudaInmediata variante="tarjeta" guia="ayuda.inmediata" />

        <section aria-labelledby="bienestar-programas" className="space-y-4">
          <div>
            <h2 id="bienestar-programas" className="text-xl font-semibold text-marino sm:text-2xl">
              {t("Programas municipales")}
            </h2>
            <p className="mt-1 max-w-prose text-[0.9375rem] text-tinta-suave">
              {t(
                "Información tomada de las fichas oficiales del Portal Ciudadano y de fuentes municipales, con fecha de consulta. Para hacer un trámite, abre su ficha; este prototipo no realiza gestiones oficiales.",
              )}
            </p>
          </div>
          <ProgramasBienestar />
        </section>
      </div>
    </>
  );
}
