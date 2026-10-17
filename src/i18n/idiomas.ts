/** Idiomas de la plataforma. «yua» es el código ISO 639-3 del maya yucateco (Maaya t'aan). */
export const IDIOMAS = ["es", "yua"] as const;
export type Idioma = (typeof IDIOMAS)[number];

export const IDIOMA_PREDETERMINADO: Idioma = "es";

export interface DatosIdioma {
  codigo: Idioma;
  /** Etiqueta BCP 47 para el atributo lang. */
  lang: string;
  /** Nombre en español (para lectores y documentación). */
  nombre: string;
  /** Cómo se llama el idioma en el propio idioma. */
  nombreNativo: string;
}

export const DATOS_IDIOMAS: Record<Idioma, DatosIdioma> = {
  es: { codigo: "es", lang: "es-MX", nombre: "Español", nombreNativo: "Español" },
  yua: { codigo: "yua", lang: "yua", nombre: "Maya yucateco", nombreNativo: "Maaya t'aan" },
};

export function esIdioma(valor: unknown): valor is Idioma {
  return typeof valor === "string" && (IDIOMAS as readonly string[]).includes(valor);
}
