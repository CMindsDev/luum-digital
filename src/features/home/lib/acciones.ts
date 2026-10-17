import { msg } from "@/i18n";
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
      return [{ tipo: "consultar_gestion", ruta: "/gestiones", etiqueta: msg("Revisar mis gestiones") }];
    case "requisitos":
      return [{ tipo: "consultar_gestion", ruta: "/gestiones", etiqueta: msg("Ver los trámites que ya iniciaste") }];
    case "reportar":
      return [{ tipo: "consultar_gestion", ruta: "/reportes/mis-reportes", etiqueta: msg("Ver mis reportes") }];
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
    titulo: msg("Reportar un problema en la calle"),
    descripcion: msg("Abre el formulario de reporte (demostración) o revisa en el mapa si alguien ya lo reportó."),
  },
  requisitos: {
    titulo: msg("Consultar los requisitos de un trámite"),
    descripcion: msg("Dime de qué trámite se trata y te muestro sus requisitos con su fuente oficial."),
  },
  consultar_folio: {
    titulo: msg("Consultar un folio"),
    descripcion: msg("Escribe tu folio de demostración o revisa tus reportes y gestiones."),
  },
  apoyo_psicologico: {
    titulo: msg("Apoyo psicológico"),
    descripcion: msg("Opciones de atención del Ayuntamiento. Si necesitas hablar con alguien ahora, usa la ayuda inmediata."),
  },
  ayuda_inmediata: {
    titulo: msg("Ayuda inmediata"),
    descripcion: msg("Si estás en peligro, llama a una línea de ayuda humana. No necesitas completar nada antes."),
  },
  negocio: {
    titulo: msg("Trámites para tu negocio"),
    descripcion: msg("Licencias, apertura de empresas y el seguimiento de lo que ya iniciaste."),
  },
  cultura: {
    titulo: msg("Cultura y actividades"),
    descripcion: msg("Talleres, cursos y apoyos culturales del catálogo municipal."),
  },
  mapa: {
    titulo: msg("Ver el mapa de la ciudad"),
    descripcion: msg("Reportes de demostración y ubicaciones verificadas en el mapa."),
  },
  pago: {
    titulo: msg("Pagos y contribuciones"),
    descripcion: msg("Fichas de pago del catálogo. En este prototipo los pagos son simulados."),
  },
  expediente: {
    titulo: msg("Mi expediente digital"),
    descripcion: msg("Tu perfil y documentos de ejemplo."),
  },
  general: {
    titulo: msg("Lo que encontré en el catálogo"),
    descripcion: msg("No identifiqué una acción concreta; revisa las fichas que más se parecen a tu búsqueda."),
  },
};

/** Consultas de ejemplo (las seis del brief). */
export const CONSULTAS_SUGERIDAS = [
  msg("Quiero reportar un bache"),
  msg("Necesito saber qué documentos pide este trámite"),
  msg("Quiero consultar mi folio"),
  msg("Busco apoyo psicológico"),
  msg("Quiero revisar un trámite de mi negocio"),
  msg("Busco actividades culturales"),
] as const;
