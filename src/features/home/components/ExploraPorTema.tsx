import { ArrowUp } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Button, SectionLabel } from "@/design-system";
import { TEMAS_INICIO } from "../lib/temas";
import { BandaTema } from "./BandaTema";

/**
 * «Explora por tema»: las seis bandas del tablero 32:162 apiladas como en Figma, dentro de un solo
 * contenedor a todo el ancho del área principal, con un botón para volver al inicio.
 */
export function ExploraPorTema() {
  const { t } = useTranslation();
  const reducirMovimiento = useReducedMotion();

  function volverArriba() {
    document.getElementById("contenido")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reducirMovimiento ? "instant" : "smooth" });
  }

  return (
    <section aria-labelledby="titulo-temas">
      <SectionLabel id="titulo-temas" className="mb-3">
        {t("Explora por tema")}
      </SectionLabel>
      <div className="relative left-1/2 w-[100cqw] -translate-x-1/2 overflow-hidden bg-crema">
        {TEMAS_INICIO.map((tema) => (
          <BandaTema key={tema.id} tema={tema} />
        ))}
        <div className="flex justify-center px-5 py-10 sm:py-14">
          <Button variante="primario" tamano="lg" iconoInicio={ArrowUp} onClick={volverArriba} className="cursor-pointer rounded-pildora" data-guia="inicio.volver_arriba">
            {t("Volver arriba")}
          </Button>
        </div>
      </div>
    </section>
  );
}
