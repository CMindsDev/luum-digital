/**
 * Internacionalización (i18next). La CLAVE de cada texto es el propio texto en español: así el español
 * es siempre el respaldo (si falta una traducción se ve el español, nunca una clave rara) y el código
 * sigue siendo legible.
 *
 *   const { t } = useTranslation();  t("Buscar")  t("Tienes {{n}} reportes", { n })
 *   const ETIQUETA = msg("Inicio");  // constantes de módulo: se marca con msg() y se traduce al pintar: t(ETIQUETA)
 *
 * Las traducciones al maya viven en src/i18n/locales/yua/*.json ({ "texto en español": "texto en maya" })
 * y se cargan sólo cuando alguien elige maya. Ver docs/I18N.md.
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { almacenamientoSeguro, PREFIJO_DEMO } from "@/utils/almacenamiento";
import { DATOS_IDIOMAS, esIdioma, IDIOMA_PREDETERMINADO, type Idioma } from "./idiomas";

const CLAVE_IDIOMA = `${PREFIJO_DEMO}idioma`;

/** Marca un texto para traducir sin traducirlo todavía (constantes de módulo). Devuelve el mismo texto. */
export const msg = (texto: string): string => texto;

const cargadoresMaya = import.meta.glob<Record<string, string>>("./locales/yua/*.json", { import: "default" });
let mayaCargado = false;

async function cargarMaya(): Promise<void> {
  if (mayaCargado) return;
  const modulos = await Promise.all(Object.values(cargadoresMaya).map((cargar) => cargar()));
  const unido: Record<string, string> = {};
  for (const modulo of modulos) for (const [clave, valor] of Object.entries(modulo)) if (valor.trim() !== "") unido[clave] = valor;
  i18n.addResourceBundle("yua", "translation", unido, true, true);
  mayaCargado = true;
}

export function idiomaGuardado(): Idioma {
  try {
    const valor = almacenamientoSeguro().getItem(CLAVE_IDIOMA);
    if (esIdioma(valor)) return valor;
  } catch {
    // Sin almacenamiento: se usa el idioma predeterminado.
  }
  return IDIOMA_PREDETERMINADO;
}

function aplicarAlDocumento(idioma: Idioma): void {
  if (typeof document !== "undefined") document.documentElement.lang = DATOS_IDIOMAS[idioma].lang;
}

/** Cambia el idioma de toda la interfaz y lo recuerda (preferencia no sensible). */
export async function cambiarIdioma(idioma: Idioma): Promise<void> {
  if (idioma === "yua") await cargarMaya();
  await i18n.changeLanguage(idioma);
  aplicarAlDocumento(idioma);
  try {
    almacenamientoSeguro().setItem(CLAVE_IDIOMA, idioma);
  } catch {
    // La preferencia sólo se pierde al recargar.
  }
}

let iniciado: Promise<void> | null = null;

/** Inicializa i18next (una sola vez). Si el idioma guardado es maya, espera a cargar su traducción. */
export function iniciarI18n(idiomaInicial: Idioma = idiomaGuardado()): Promise<void> {
  iniciado ??= (async () => {
    await i18n.use(initReactI18next).init({
      lng: "es",
      fallbackLng: "es",
      supportedLngs: ["es", "yua"],
      resources: { es: { translation: {} }, yua: { translation: {} } },
      keySeparator: false,
      nsSeparator: false,
      returnEmptyString: false,
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
    if (idiomaInicial === "yua") await cambiarIdioma("yua");
    else aplicarAlDocumento("es");
  })();
  return iniciado;
}

export { i18n };
export { DATOS_IDIOMAS, IDIOMAS, esIdioma, IDIOMA_PREDETERMINADO, type Idioma } from "./idiomas";
