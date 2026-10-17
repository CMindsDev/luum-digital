import { useTranslation } from "react-i18next";
import { useActiveIdentity } from "@/app/session/store";
import { SectionLabel } from "@/design-system";
import { AccesosRapidos } from "../components/AccesosRapidos";
import { ExploraPorTema } from "../components/ExploraPorTema";
import { HeroInicio } from "../components/HeroInicio";
import { ResumenGestiones } from "../components/ResumenGestiones";
import { ResumenReportes } from "../components/ResumenReportes";

/**
 * Inicio: resolver necesidades, no una portada saturada (brief §8). Héroe con saludo y buscador en
 * lenguaje natural, accesos rápidos con los mosaicos del Laboratorio, seguimiento de mis gestiones y
 * reportes de demostración y «Explora por tema» con las bandas del tablero Figma 32:162.
 * Sin estadísticas ficticias ni gráficas decorativas; sin novedades no verificadas.
 */
export default function HomePage() {
  const { t } = useTranslation();
  const identidad = useActiveIdentity();
  const nombre = identidad.nombre.split(" ")[0] ?? identidad.nombre;

  return (
    <div className="flex flex-col gap-10 sm:gap-12">
      <HeroInicio nombre={nombre} />
      <AccesosRapidos />
      <section aria-labelledby="titulo-seguimiento">
        <SectionLabel id="titulo-seguimiento" className="mb-3">
          {t("Tu seguimiento")}
        </SectionLabel>
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-6">
          <ResumenGestiones />
          <ResumenReportes />
        </div>
      </section>
      <ExploraPorTema />
    </div>
  );
}
