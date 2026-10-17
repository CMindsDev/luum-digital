import { Languages } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cx, notificar } from "@/design-system";
import { DATOS_IDIOMAS, type Idioma } from "@/i18n";
import { useIdioma } from "@/i18n/useIdioma";

/**
 * Cambia entre español y maya yucateco. Muestra el nombre del OTRO idioma en ese idioma (así quien lee
 * maya lo reconoce aunque la interfaz esté en español) y anuncia el cambio. Sólo hay dos idiomas: un
 * botón es más claro y más rápido que un menú.
 */
export function SelectorIdioma({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { idioma, cambiar } = useIdioma();
  const [cambiando, setCambiando] = useState(false);
  const otro: Idioma = idioma === "es" ? "yua" : "es";
  const destino = DATOS_IDIOMAS[otro];

  async function seleccionar() {
    setCambiando(true);
    try {
      await cambiar(otro);
    } catch {
      notificar({
        tono: "error",
        titulo: t("No se pudo completar"),
        descripcion: t("No pudimos cargar esta información. Intenta de nuevo en un momento."),
      });
    } finally {
      setCambiando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void seleccionar()}
      disabled={cambiando}
      aria-busy={cambiando}
      lang={destino.lang}
      data-guia="encabezado.idioma"
      aria-label={`${t("Cambiar idioma a {{idioma}}", { idioma: destino.nombre })}`}
      title={t("Cambiar idioma a {{idioma}}", { idioma: destino.nombre })}
      className={cx(
        "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-boton px-2 text-xs font-semibold text-white hover:bg-white/10 focus-visible:outline-3 focus-visible:outline-foco disabled:opacity-60 sm:px-3 sm:text-sm",
        className,
      )}
    >
      <Languages aria-hidden="true" className="size-5 shrink-0" />
      <span>{destino.nombreNativo}</span>
    </button>
  );
}
