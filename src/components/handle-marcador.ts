import type { UIMatch } from "react-router";

/** Datos que una ruta marcador declara en `handle` (título y destino del botón regresar). */
export interface HandleMarcador {
  titulo: string;
  regresar?: string;
}

function esHandleMarcador(valor: unknown): valor is HandleMarcador {
  return typeof valor === "object" && valor !== null && "titulo" in valor && typeof valor.titulo === "string";
}

/** Toma el `handle` de la ruta más profunda que lo declare. */
export function leerHandleMarcador(coincidencias: UIMatch[]): HandleMarcador | undefined {
  for (let i = coincidencias.length - 1; i >= 0; i -= 1) {
    const handle = coincidencias[i]?.handle;
    if (esHandleMarcador(handle)) return handle;
  }
  return undefined;
}
