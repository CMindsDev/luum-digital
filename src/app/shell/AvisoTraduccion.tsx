import { Languages } from "lucide-react";
import { useIdioma } from "@/i18n/useIdioma";

/**
 * Respaldo en español mientras la traducción automática no cuente con revisión de hablantes.
 */
export function AvisoTraduccion() {
  const { idioma } = useIdioma();
  if (idioma !== "yua") return null;
  return (
    <p className="flex min-h-7 items-center justify-center gap-1.5 bg-marino px-4 py-1 text-center text-xs leading-tight text-white" data-aviso-traduccion="">
      <Languages aria-hidden="true" className="size-3.5 shrink-0" />
      <span lang="es-MX">Traducción automática preliminar, pendiente de revisión por hablantes de maya. Voz experimental: puedes escribir o volver a español.</span>
    </p>
  );
}
