import { normalizarTexto } from "@/domain/busqueda";
import { NOMBRE_CATEGORIA_REPORTE } from "@/domain/reportes";
import { DESCRIPCION_REPORTE } from "@/domain/validaciones";
import type { AsistenciaReporte, CategoriaReporte, Ubicacion } from "@/types";

/**
 * «Asistencia simulada» del formulario de reporte: reglas locales reproducibles, sin IA.
 * Sugiere el tipo, arma un resumen, señala información faltante y cuenta posibles coincidencias.
 * Nunca afirma que una foto demuestre profundidad, peligrosidad ni autenticidad: la foto sólo se
 * menciona como apoyo opcional para ubicar el problema.
 */

const PALABRAS_POR_TIPO: readonly { categoria: CategoriaReporte; patron: RegExp }[] = [
  { categoria: "animal_muerto", patron: /animal muerto|perro muerto|gato muerto|sin vida|cadaver/ },
  { categoria: "recoleccion_basura", patron: /no paso (el camion|la basura|la recoleccion)|recoleccion|camion de (la )?basura|no han recogido|no recogieron/ },
  { categoria: "bache", patron: /\bbache|\bhoyo|\bhueco|pavimento|hundimiento|socavon/ },
  { categoria: "desazolve_rejilla", patron: /rejilla|desazolve|coladera|encharca|inunda|alcantarilla|charco/ },
  { categoria: "luminaria", patron: /luminaria|alumbrado|\bfoco|lampara|\bposte|sin luz|no enciende|no prende|parpade|oscur/ },
  { categoria: "parques_jardines", patron: /\bparque|jardin|maleza|area verde|poda|hierba/ },
  { categoria: "basura_via_publica", patron: /basura|cacharro|escombro|tiradero|bolsas/ },
];

/** Palabras que ubican el problema dentro de la calle. */
const REFERENCIA_EN_TEXTO = /esquina|frente|junto|entrada|cruce|carril|mitad|orilla|banqueta|parque|escuela|tienda|parada|numero|\bnum\b|#|\bx\b|entre|cerca|a un lado|enfrente/;

export function sugerirCategoria(descripcion: string): CategoriaReporte | null {
  const texto = normalizarTexto(descripcion);
  if (texto.length < 4) return null;
  return PALABRAS_POR_TIPO.find(({ patron }) => patron.test(texto))?.categoria ?? null;
}

function primeraFrase(texto: string, maximo = 110): string {
  const limpio = texto.trim().replace(/\s+/g, " ");
  const frase = limpio.split(/(?<=[.!?])\s/)[0] ?? limpio;
  if (frase.length <= maximo) return frase.replace(/[.!?]+$/, "");
  return `${frase.slice(0, maximo - 1).replace(/\s+\S*$/, "")}…`;
}

export interface DatosAsistencia {
  categoria: CategoriaReporte | "";
  descripcion: string;
  ubicacion: Pick<Ubicacion, "referencia" | "colonia" | "origen"> | null;
  /** En modo manual, si se escribió al menos un cruzamiento. */
  conCruzamientos?: boolean;
  tieneFoto: boolean;
}

export interface Faltante {
  aspecto: "descripcion" | "ubicacion" | "foto";
  texto: string;
}

/** Información que falta o mejoraría el reporte, por aspecto (cada paso muestra lo suyo). */
export function evaluarFaltantes(datos: DatosAsistencia): Faltante[] {
  const descripcion = datos.descripcion.trim();
  const faltantes: Faltante[] = [];

  if (descripcion.length < DESCRIPCION_REPORTE.minimo) {
    faltantes.push({ aspecto: "descripcion", texto: `Describe el problema con al menos ${DESCRIPCION_REPORTE.minimo} caracteres.` });
  } else if (!REFERENCIA_EN_TEXTO.test(normalizarTexto(descripcion)) && datos.categoria !== "recoleccion_basura") {
    faltantes.push({ aspecto: "descripcion", texto: "Di en qué parte está: esquina, carril, frente a qué lugar…" });
  }

  if (!datos.ubicacion) {
    faltantes.push({ aspecto: "ubicacion", texto: "Falta confirmar la ubicación." });
  } else {
    if (datos.ubicacion.origen === "manual" && datos.conCruzamientos === false) {
      faltantes.push({ aspecto: "ubicacion", texto: "Agrega los cruzamientos para ubicarlo mejor." });
    }
    if (!datos.ubicacion.colonia) {
      faltantes.push({ aspecto: "ubicacion", texto: "Indica la colonia o comisaría: ayuda a encontrar reportes iguales." });
    }
  }

  if (!datos.tieneFoto) {
    faltantes.push({ aspecto: "foto", texto: "Si es seguro tomarla, puedes agregar una foto (opcional)." });
  }
  return faltantes;
}

export function generarAsistencia(datos: DatosAsistencia): AsistenciaReporte {
  const descripcion = datos.descripcion.trim();
  const sugerida = sugerirCategoria(descripcion);
  const faltantes = evaluarFaltantes(datos).map((faltante) => faltante.texto);

  const partes: string[] = [];
  if (datos.categoria) partes.push(NOMBRE_CATEGORIA_REPORTE[datos.categoria]);
  if (descripcion) partes.push(primeraFrase(descripcion));
  let resumen = partes.join(": ");
  if (datos.ubicacion) {
    const lugar = datos.ubicacion.colonia ? `${datos.ubicacion.referencia}, ${datos.ubicacion.colonia}` : datos.ubicacion.referencia;
    resumen += `${resumen ? ". " : ""}Ubicación: ${lugar}`;
  }
  if (resumen) resumen += ".";

  return {
    ...(sugerida ? { categoriaSugerida: sugerida } : {}),
    ...(resumen ? { resumen } : {}),
    faltantes,
    origen: "reglas_demo",
  };
}

/** Texto de coincidencias para la asistencia (el detalle está en el paso «Coincidencias»). */
export function describirCoincidencias(total: number | null): string {
  if (total === null) return "Revisaremos si hay reportes iguales abiertos cerca antes de enviar.";
  if (total === 0) return "No encontramos reportes iguales abiertos cerca (mismo tipo, a 60 m o en la misma calle y colonia).";
  return total === 1
    ? "Encontramos 1 posible reporte igual cerca. Revísalo para no duplicar."
    : `Encontramos ${total} posibles reportes iguales cerca. Revísalos para no duplicar.`;
}
