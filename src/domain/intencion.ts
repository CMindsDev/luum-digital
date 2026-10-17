import type { AccionSugerida, CategoriaReporte, IntencionDetectada, ResultadoBusqueda } from "@/types";
import { extraerFolio, tipoDeFolio } from "./folios";
import { normalizarTexto } from "./busqueda";
import { NOMBRE_CATEGORIA_REPORTE } from "./reportes";

/**
 * Detección de intención con reglas locales reproducibles (sin IA). Cada intención propone acciones
 * concretas dentro de la app (rutas acordadas en AGENTS.md). El asistente y el buscador las muestran;
 * la persona decide.
 *
 * Orden de evaluación: ayuda inmediata > apoyo psicológico > folio > reportar > requisitos > negocio >
 * pago > cultura > expediente > mapa > general.
 */

/** Ids de catálogo de las fichas verificadas de atención psicológica (Portal Ciudadano). */
export const SERVICIOS_APOYO_PSICOLOGICO = {
  apoyoPsicologico: "mid-bih-007",
  atencionPsicologica: "mid-bih-016",
} as const;

export interface ContextoIntencion {
  /** Servicio que la persona está viendo (ficha abierta), si lo hay. */
  servicioActualId?: string;
  /** Resultados de búsqueda ya calculados, para proponer fichas concretas. */
  resultados?: readonly ResultadoBusqueda[];
}

interface Regla {
  patron: RegExp;
}

const contiene = (texto: string, ...patrones: RegExp[]) => patrones.some((p) => p.test(texto));

const RIESGO_INMEDIATO: Regla[] = [
  { patron: /\bsuicid/ },
  { patron: /quitarme la vida|matarme|me quiero morir|no quiero vivir|hacerme dano|lastimarme/ },
  { patron: /\bemergencia\b|\burgente\b.*\bayuda\b|\bauxilio\b/ },
];

const VIOLENCIA: Regla[] = [{ patron: /violencia|me golpea|me pega|me amenaza|agresion|acoso|linea mujer/ }];

const APOYO_PSICOLOGICO: Regla[] = [
  { patron: /psicolog|salud mental|terapia|terapeuta|ansiedad|depresion|deprimid|triste|tristeza|angustia|estres|estresad|me siento mal|crisis emocional|duelo/ },
];

const CONSULTAR_FOLIO: Regla[] = [
  { patron: /\bfolio\b|\bseguimiento\b|estatus|como va mi|en que va mi|estado de mi (reporte|tramite|gestion|solicitud)/ },
];

const VERBOS_REPORTE = /reportar|reporte|reporto|denunciar|levantar un reporte|hay un|hay una|no sirve|no prende|se fundio|esta tapad|esta lleno|no paso|no han pasado/;

const PALABRAS_CATEGORIA: { categoria: CategoriaReporte; patron: RegExp }[] = [
  { categoria: "bache", patron: /\bbache|\bhoyo|\bhueco|pavimento roto/ },
  { categoria: "luminaria", patron: /luminaria|alumbrado|\bfoco|lampara|\bposte|sin luz|calle oscura/ },
  { categoria: "desazolve_rejilla", patron: /rejilla|desazolve|coladera|encharca|inunda|alcantarilla|drenaje pluvial/ },
  { categoria: "animal_muerto", patron: /animal muerto|perro muerto|gato muerto|cadaver de/ },
  { categoria: "recoleccion_basura", patron: /no paso (el camion|la basura)|recoleccion|camion de la basura|no han recogido/ },
  { categoria: "basura_via_publica", patron: /basura|cacharro|escombro|tiradero/ },
  { categoria: "parques_jardines", patron: /\bparque|jardin|maleza|area verde|poda/ },
];

const REQUISITOS: Regla[] = [
  { patron: /requisito|que documentos|documentos (me )?pide|documentos necesito|que necesito|que me piden|que piden|papeles|que llevar/ },
];

const NEGOCIO: Regla[] = [
  { patron: /negocio|empresa|emprend|licencia de funcionamiento|abrir un local|mi local|establecimiento|changarro|comercio|giro comercial|uso de suelo/ },
];

const PAGO: Regla[] = [{ patron: /\bpagar\b|\bpago\b|predial|impuesto|adeudo|multa/ }];

const CULTURA: Regla[] = [
  { patron: /cultura|cultural|museo|teatro|concierto|danza|musica|festival|exposicion|actividades artisticas|taller de arte|planetario/ },
];

const EXPEDIENTE: Regla[] = [{ patron: /expediente|mis documentos|mis datos|mi perfil/ }];

const MAPA: Regla[] = [{ patron: /\bmapa\b|visor urbano|donde hay|cerca de mi|en mi colonia/ }];

function categoriaDeReporte(texto: string): CategoriaReporte | null {
  for (const { categoria, patron } of PALABRAS_CATEGORIA) if (patron.test(texto)) return categoria;
  return null;
}

function cumple(texto: string, reglas: readonly Regla[]): boolean {
  return contiene(texto, ...reglas.map((r) => r.patron));
}

function accionesDeResultados(resultados: readonly ResultadoBusqueda[] | undefined, maximo = 3): AccionSugerida[] {
  return (resultados ?? []).slice(0, maximo).map((r) => ({
    tipo: "abrir_servicio",
    servicioId: r.servicio.id,
    etiqueta: `Abrir «${r.servicio.nombreCiudadano ?? r.servicio.nombre}»`,
  }));
}

export function detectarIntencion(consulta: string, contexto: ContextoIntencion = {}): IntencionDetectada {
  const texto = normalizarTexto(consulta);

  // 1) Señales de riesgo: ayuda humana primero, sin esperar a nada más.
  if (cumple(texto, RIESGO_INMEDIATO)) {
    return {
      intencion: "ayuda_inmediata",
      confianza: 0.95,
      acciones: [
        { tipo: "abrir_ruta", ruta: "/bienestar/salud-mental", etiqueta: "Ver ayuda inmediata" },
        { tipo: "abrir_ruta", ruta: "/bienestar", etiqueta: "Ver opciones de bienestar" },
      ],
    };
  }
  if (cumple(texto, VIOLENCIA)) {
    return {
      intencion: "ayuda_inmediata",
      confianza: 0.9,
      acciones: [
        { tipo: "abrir_ruta", ruta: "/bienestar/linea-mujer", etiqueta: "Abrir Línea Mujer y ayuda inmediata" },
        { tipo: "abrir_ruta", ruta: "/bienestar", etiqueta: "Ver opciones de bienestar" },
      ],
    };
  }

  // 2) Apoyo psicológico: salud mental con la ayuda inmediata siempre visible.
  if (cumple(texto, APOYO_PSICOLOGICO)) {
    return {
      intencion: "apoyo_psicologico",
      confianza: 0.9,
      acciones: [
        { tipo: "abrir_ruta", ruta: "/bienestar/salud-mental", etiqueta: "Abrir salud mental (ayuda inmediata visible)" },
        {
          tipo: "abrir_servicio",
          servicioId: SERVICIOS_APOYO_PSICOLOGICO.apoyoPsicologico,
          etiqueta: "Ver «Apoyo Psicológico» (centros Alma Nova)",
        },
        {
          tipo: "abrir_servicio",
          servicioId: SERVICIOS_APOYO_PSICOLOGICO.atencionPsicologica,
          etiqueta: "Ver «Atención Psicológica» (módulos de salud)",
        },
      ],
    };
  }

  // 3) Consultar folio.
  if (cumple(texto, CONSULTAR_FOLIO)) {
    const folio = extraerFolio(consulta);
    const tipo = folio ? tipoDeFolio(folio) : null;
    if (folio && tipo === "reporte") {
      return {
        intencion: "consultar_folio",
        confianza: 0.95,
        acciones: [{ tipo: "consultar_gestion", ruta: `/reportes/mis-reportes?folio=${folio}`, etiqueta: `Consultar el reporte ${folio}` }],
      };
    }
    if (folio && tipo !== null) {
      return {
        intencion: "consultar_folio",
        confianza: 0.95,
        acciones: [{ tipo: "consultar_gestion", ruta: `/gestiones?folio=${folio}`, etiqueta: `Consultar la gestión ${folio}` }],
      };
    }
    return {
      intencion: "consultar_folio",
      confianza: 0.85,
      acciones: [
        { tipo: "consultar_gestion", ruta: "/reportes/mis-reportes", etiqueta: "Consultar mis reportes" },
        { tipo: "consultar_gestion", ruta: "/gestiones", etiqueta: "Consultar mis gestiones" },
      ],
    };
  }

  // 4) Reportar un problema en la vía pública.
  const categoria = categoriaDeReporte(texto);
  if (VERBOS_REPORTE.test(texto) || categoria !== null) {
    if (categoria) {
      const nombre = NOMBRE_CATEGORIA_REPORTE[categoria];
      return {
        intencion: "reportar",
        confianza: VERBOS_REPORTE.test(texto) ? 0.9 : 0.75,
        acciones: [
          { tipo: "abrir_formulario", ruta: `/reportes/nuevo/${categoria}`, etiqueta: `Reportar: ${nombre}` },
          { tipo: "abrir_mapa", ruta: `/mapa?categoria=${categoria}`, etiqueta: `Ver reportes de ${nombre.toLowerCase()} en el mapa` },
        ],
      };
    }
    if (VERBOS_REPORTE.test(texto) && /reportar|reporte|denunciar/.test(texto)) {
      return {
        intencion: "reportar",
        confianza: 0.6,
        acciones: [{ tipo: "abrir_ruta", ruta: "/reportes", etiqueta: "Elegir el tipo de reporte" }],
      };
    }
  }

  // 5) Requisitos de un trámite.
  if (cumple(texto, REQUISITOS)) {
    if (contexto.servicioActualId) {
      return {
        intencion: "requisitos",
        confianza: 0.9,
        acciones: [{ tipo: "mostrar_requisitos", servicioId: contexto.servicioActualId, etiqueta: "Ver los requisitos de este trámite" }],
      };
    }
    const concretos = (contexto.resultados ?? []).filter((r) => r.puntuacion >= 10).slice(0, 3);
    return {
      intencion: "requisitos",
      confianza: concretos.length > 0 ? 0.8 : 0.7,
      acciones: [
        ...concretos.map<AccionSugerida>((r) => ({
          tipo: "mostrar_requisitos",
          servicioId: r.servicio.id,
          etiqueta: `Requisitos de «${r.servicio.nombreCiudadano ?? r.servicio.nombre}»`,
        })),
        { tipo: "abrir_ruta", ruta: "/servicios", etiqueta: "Elige el trámite para ver sus requisitos" },
      ],
    };
  }

  // 6) Negocios.
  if (cumple(texto, NEGOCIO)) {
    return {
      intencion: "negocio",
      confianza: 0.85,
      acciones: [
        { tipo: "abrir_ruta", ruta: "/servicios/categoria/negocios", etiqueta: "Ver trámites para tu negocio" },
        ...accionesDeResultados(contexto.resultados, 2),
      ],
    };
  }

  // 7) Pagos.
  if (cumple(texto, PAGO)) {
    return {
      intencion: "pago",
      confianza: 0.8,
      acciones: [
        { tipo: "abrir_ruta", ruta: "/servicios/categoria/pagos", etiqueta: "Ver pagos y contribuciones" },
        ...accionesDeResultados(contexto.resultados, 2),
      ],
    };
  }

  // 8) Cultura.
  if (cumple(texto, CULTURA)) {
    return {
      intencion: "cultura",
      confianza: 0.85,
      acciones: [
        { tipo: "abrir_ruta", ruta: "/servicios/categoria/cultura", etiqueta: "Ver cultura y actividades" },
        ...accionesDeResultados(contexto.resultados, 2),
      ],
    };
  }

  // 9) Expediente.
  if (cumple(texto, EXPEDIENTE)) {
    return {
      intencion: "expediente",
      confianza: 0.8,
      acciones: [{ tipo: "abrir_ruta", ruta: "/expediente", etiqueta: "Abrir mi Expediente Digital (ejemplo)" }],
    };
  }

  // 10) Mapa.
  if (cumple(texto, MAPA)) {
    return {
      intencion: "mapa",
      confianza: 0.75,
      acciones: [{ tipo: "abrir_mapa", ruta: "/mapa", etiqueta: "Abrir el mapa" }],
    };
  }

  // 11) General: las mejores fichas del catálogo.
  const acciones = accionesDeResultados(contexto.resultados, 3);
  return {
    intencion: "general",
    confianza: acciones.length > 0 ? 0.5 : 0.2,
    acciones: acciones.length > 0 ? acciones : [{ tipo: "abrir_ruta", ruta: "/servicios", etiqueta: "Explorar el catálogo" }],
  };
}
