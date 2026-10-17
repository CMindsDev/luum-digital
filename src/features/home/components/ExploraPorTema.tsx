import { SectionLabel } from "@/design-system";
import { TEMAS_INICIO } from "../lib/temas";
import { BandaTema } from "./BandaTema";

/**
 * «Explora por tema»: las seis bandas del tablero 32:162 apiladas como en Figma, dentro de un solo
 * contenedor a todo el ancho del área principal, y el cierre con el patrón de cadena azul.
 */
export function ExploraPorTema() {
  return (
    <section aria-labelledby="titulo-temas">
      <SectionLabel id="titulo-temas" className="mb-3">
        Explora por tema
      </SectionLabel>
      <div className="relative left-1/2 w-[100cqw] -translate-x-1/2 overflow-hidden bg-crema">
        {TEMAS_INICIO.map((tema) => (
          <BandaTema key={tema.id} tema={tema} />
        ))}
        <div aria-hidden="true" className="flex justify-center py-10 sm:py-14">
          {/* El SVG del patrón es vertical (97.6 × 290.5) y se dibuja girado 90°. */}
          <span className="relative block h-[3.75rem] w-[11.25rem] sm:h-[5rem] sm:w-[15rem]">
            <img
              src="/brand/laboratorio/tablero/patron-cadena-cierre.svg"
              alt=""
              className="absolute top-1/2 left-1/2 h-[11.25rem] w-[3.78rem] max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90 select-none sm:h-[15rem] sm:w-[5.04rem]"
            />
          </span>
        </div>
      </div>
    </section>
  );
}
