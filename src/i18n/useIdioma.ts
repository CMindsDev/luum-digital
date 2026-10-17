import { useTranslation } from "react-i18next";
import { cambiarIdioma, DATOS_IDIOMAS, esIdioma, IDIOMA_PREDETERMINADO, type Idioma } from "./index";

/** Idioma vigente de la interfaz y cómo cambiarlo. */
export function useIdioma(): { idioma: Idioma; datos: (typeof DATOS_IDIOMAS)[Idioma]; cambiar: (idioma: Idioma) => Promise<void> } {
  const { i18n } = useTranslation();
  const idioma = esIdioma(i18n.language) ? i18n.language : IDIOMA_PREDETERMINADO;
  return { idioma, datos: DATOS_IDIOMAS[idioma], cambiar: cambiarIdioma };
}
