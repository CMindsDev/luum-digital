import type { AccionSugerida, IntencionDetectada } from "@/types";

/**
 * Traducción de las acciones sugeridas por la búsqueda (src/domain/intencion.ts) a rutas internas
 * del prototipo. Ninguna acción abre un sitio externo: todas llevan a una pantalla de la app.
 */

export type TipoIntencion = IntencionDetectada["intencion"];

/** Ruta interna de una acción sugerida. Los requisitos abren la ficha en la sección «Requisitos». */
export function rutaDeAccion(accion: AccionSugerida): string {
  switch (accion.tipo) {
    case "abrir_servicio":
      return `/servicios/${encodeURIComponent(accion.servicioId)}`;
    case "mostrar_requisitos":
      return `/servicios/${encodeURIComponent(accion.servicioId)}#requisitos`;
    case "abrir_formulario":
    case "consultar_gestion":
    case "abrir_mapa":
    case "abrir_ruta":
      return accion.ruta;
  }
}

/**
 * Acciones que la pantalla de búsqueda agrega a las del dominio para que cada intención tenga un
 * siguiente paso útil (p. ej. «revisar un trámite de mi negocio» también ofrece «Mis gestiones»).
 */
export function accionesComplementarias(intencion: TipoIntencion): AccionSugerida[] {
  switch (intencion) {
    case "negocio":
      return [{ tipo: "consultar_gestion", ruta: "/gestiones", etiqueta: "Revisar mis gestiones" }];
    case "requisitos":
      return [{ tipo: "consultar_gestion", ruta: "/gestiones", etiqueta: "Ver los trámites que ya iniciaste" }];
    case "reportar":
      return [{ tipo: "consultar_gestion", ruta: "/reportes/mis-reportes", etiqueta: "Ver mis reportes" }];
    default:
      return [];
  }
}

/** Une acciones sin repetir destinos, en orden, hasta `maximo`. */
export function unirAcciones(principales: readonly AccionSugerida[], extra: readonly AccionSugerida[], maximo = 5): AccionSugerida[] {
  const vistas = new Set<string>();
  const resultado: AccionSugerida[] = [];
  for (const accion of [...principales, ...extra]) {
    const ruta = rutaDeAccion(accion);
    if (vistas.has(ruta)) continue;
    vistas.add(ruta);
    resultado.push(accion);
    if (resultado.length >= maximo) break;
  }
  return resultado;
}

/** Título y explicación breve de cada intención, en lenguaje ciudadano. */
export const TEXTO_INTENCION: Record<TipoIntencion, { titulo: string; descripcion: string }> = {
  reportar: {
    titulo: "Reportar un problema en la calle",
    descripcion: "Abre el formulario de reporte (demostración) o revisa en el mapa si alguien ya lo reportó.",
  },
  requisitos: {
    titulo: "Consultar los requisitos de un trámite",
    descripcion: "Dime de qué trámite se trata y te muestro sus requisitos con su fuente oficial.",
  },
  consultar_folio: {
    titulo: "Consultar un folio",
    descripcion: "Escribe tu folio de demostración o revisa tus reportes y gestiones.",
  },
  apoyo_psicologico: {
    titulo: "Apoyo psicológico",
    descripcion: "Opciones de atención del Ayuntamiento. Si necesitas hablar con alguien ahora, usa la ayuda inmediata.",
  },
  ayuda_inmediata: {
    titulo: "Ayuda inmediata",
    descripcion: "Si estás en peligro, llama a una línea de ayuda humana. No necesitas completar nada antes.",
  },
  negocio: {
    titulo: "Trámites para tu negocio",
    descripcion: "Licencias, apertura de empresas y el seguimiento de lo que ya iniciaste.",
  },
  cultura: {
    titulo: "Cultura y actividades",
    descripcion: "Talleres, cursos y apoyos culturales del catálogo municipal.",
  },
  mapa: {
    titulo: "Ver el mapa de la ciudad",
    descripcion: "Reportes de demostración y ubicaciones verificadas en el mapa.",
  },
  pago: {
    titulo: "Pagos y contribuciones",
    descripcion: "Fichas de pago del catálogo. En este prototipo los pagos son simulados.",
  },
  expediente: {
    titulo: "Mi expediente digital",
    descripcion: "Tu perfil y documentos de ejemplo.",
  },
  general: {
    titulo: "Lo que encontré en el catálogo",
    descripcion: "No identifiqué una acción concreta; revisa las fichas que más se parecen a tu búsqueda.",
  },
};

/** Consultas de ejemplo (las seis del brief). */
export const CONSULTAS_SUGERIDAS = [
  "Quiero reportar un bache",
  "Necesito saber qué documentos pide este trámite",
  "Quiero consultar mi folio",
  "Busco apoyo psicológico",
  "Quiero revisar un trámite de mi negocio",
  "Busco actividades culturales",
] as const;
