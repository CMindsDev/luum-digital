import { useTranslation } from "react-i18next";
import { AyudaInmediata } from "@/components/ayuda/AyudaInmediata";
import { FOTOS_BANDA, ICONOS_BANDA } from "@/design-system/lib/recursos-laboratorio";

/**
 * Banda «Salud y Bienestar» del tablero del Laboratorio (32:162, banda 04) como encabezado de la
 * sección. Corrección de contraste (ESPECIFICACION_FIGMA §7): el degradado crema → azul queda como
 * franja decorativa superior y todo el texto va sobre azul sólido (blanco 5.74:1). La ayuda
 * inmediata tiene prioridad visual sobre la decoración; la foto se omite en móvil.
 */
export function BandaSaludBienestar() {
  const { t } = useTranslation();

  return (
    <header className="superficie-oscura relative left-1/2 mb-8 w-[100cqw] -translate-x-1/2 overflow-hidden bg-azul text-white">
      <div aria-hidden="true" className="h-14 bg-linear-to-b from-crema to-azul sm:h-20" />
      <div className="grid gap-6 px-5 pb-6 sm:px-8 sm:pb-8 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] md:items-end lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="min-w-0">
          <img src={ICONOS_BANDA.salud} alt="" aria-hidden="true" width={64} height={52} className="h-13 w-auto" />
          <h1 tabIndex={-1} className="mt-5 text-[clamp(2.4rem,8vw,4.75rem)] leading-[0.972] font-normal tracking-[-0.05em] text-white">
            <span className="block">{t("Salud y")}</span>{" "}
            <span className="block font-serif tracking-[-0.044em] italic">{t("Bienestar")}</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white">
            {t("Encuentra programas de salud, salud mental, educación, deporte y atención para mujeres. Cada programa indica su fuente oficial.")}
          </p>
          <div className="mt-6 max-w-sm">
            <AyudaInmediata guia="bienestar.ayuda_inmediata" anchoCompleto className="ring-2 ring-white" />
          </div>
        </div>
        <img
          src={FOTOS_BANDA.salud}
          alt=""
          width={780}
          height={591}
          loading="lazy"
          decoding="async"
          className="hidden aspect-[370/400] w-full rounded-[2rem] object-cover object-[60%_50%] md:block"
        />
      </div>
    </header>
  );
}
