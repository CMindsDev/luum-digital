/**
 * Colonias y comisarías para la ubicación manual. Son datos de referencia estáticos (centroides
 * APROXIMADOS, no límites oficiales). No hay un hook de servicios para ellos: este es el único
 * punto del módulo que lee src/data, y sólo para poblar la lista y centrar la ubicación aproximada.
 */
import { COLONIAS_DEMO, LEYENDA_COLONIAS, type ColoniaDemo } from "@/data/colonias";
import type { OpcionSelect } from "@/design-system";

export type { ColoniaDemo };

export { LEYENDA_COLONIAS };

const ordenadas = [...COLONIAS_DEMO].sort((a, b) => a.nombre.localeCompare(b.nombre, "es-MX"));

export const OPCIONES_COLONIA: readonly OpcionSelect[] = ordenadas.map((colonia) => ({
  valor: colonia.id,
  etiqueta: colonia.tipo === "comisaria" && !/comisar/i.test(colonia.nombre) ? `${colonia.nombre} (comisaría)` : colonia.nombre,
}));

export function coloniaPorId(id: string): ColoniaDemo | undefined {
  return COLONIAS_DEMO.find((colonia) => colonia.id === id);
}

/** Busca la colonia por nombre escrito (sin acentos ni mayúsculas). Para prellenar desde el asistente. */
export function coloniaPorNombre(nombre: string): ColoniaDemo | undefined {
  const clave = normalizar(nombre);
  if (!clave) return undefined;
  return COLONIAS_DEMO.find((colonia) => normalizar(colonia.nombre) === clave || colonia.id === clave);
}

/** Primera colonia cuyo nombre aparece en un texto libre («calle 60 del Centro» → Centro). */
export function coloniaMencionada(texto: string): ColoniaDemo | undefined {
  const normal = ` ${normalizar(texto)} `;
  // Primero los nombres más largos («Ciudad Caucel» antes que «Caucel»).
  const porLargo = [...COLONIAS_DEMO].sort((a, b) => b.nombre.length - a.nombre.length);
  return porLargo.find((colonia) => normal.includes(` ${normalizar(colonia.nombre)} `));
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
