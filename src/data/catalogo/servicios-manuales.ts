import type { CanalAtencion, FuenteConsultada, Servicio } from "@/types";

/**
 * Módulos que no están en el listado de trámites del Portal Ciudadano pero sí en fuentes oficiales
 * (Mérida Móvil, Expediente Digital, Visor Urbano y otras secciones del Portal Ciudadano).
 * Nombres, fuentes y fechas tomados de la investigación del 2026-10-17 (web-merida-movil,
 * web-portal-municipal y web-portal-ciudadano). Nada transaccional es real: estadoDeIntegracion «simulada».
 *
 * «Ayuntatel» no se repite aquí porque ya está en el listado (MID-PAC-315, «Atención Ciudadana en Ayuntatel»).
 */

const FECHA = "2026-10-17";

const APP_STORE_MERIDA_MOVIL = "https://apps.apple.com/mx/app/m%C3%A9rida-m%C3%B3vil/id1065129797";
const PLAY_MERIDA_MOVIL = "https://play.google.com/store/apps/details?id=app.meridamovil.com&hl=es_419&gl=MX";
const NOTA_MIDIGITAL =
  "https://prensa.merida.gob.mx/12522/Presenta-Cecilia-Patron-MIDigital-innovadora-transformacion-tecnologica-del-Ayuntamiento-de-Merida/amp";

function fuente(nombre: string, url: string, fechaActualizacionFuente?: string): FuenteConsultada {
  return { nombre, url, fechaConsulta: FECHA, ...(fechaActualizacionFuente ? { fechaActualizacionFuente } : {}) };
}

const CANAL_APP: CanalAtencion = {
  tipo: "app",
  etiqueta: "Mérida Móvil (iOS y Android)",
  valor: APP_STORE_MERIDA_MOVIL,
  verificado: true,
  fuente: APP_STORE_MERIDA_MOVIL,
};

const base = {
  estadoDeIntegracion: "simulada",
  fechaDeVerificacion: FECHA,
  costo: { tipo: "pendiente" },
} as const satisfies Partial<Servicio>;

export const SERVICIOS_MANUALES: readonly Servicio[] = [
  {
    ...base,
    id: "bache-a-la-vista",
    nombre: "Bache a la vista",
    nombreCiudadano: "Reportar un bache al instante",
    categoria: "reportes",
    descripcion:
      "Reporte al instante de baches de Mérida Móvil: «¡obtén tu folio al confirmar tu ubicación!». En el prototipo agrega verificación ciudadana y puntos de demostración (propuesta).",
    dependencia: "Ayuntamiento de Mérida (Mérida Móvil)",
    sistemaDeOrigen: "Mérida Móvil",
    fuenteOficial: fuente("Mérida Móvil · historial de versiones (3.1.0)", APP_STORE_MERIDA_MOVIL, "2024-12-26"),
    estadoDeInformacion: "verificada",
    rutaInterna: "/reportes/nuevo/bache",
    tipoDeRecorrido: "reporte",
    requisitos: [
      { nombre: "Confirmar la ubicación del bache en el mapa", obligatorio: true },
      { nombre: "Cuenta de Mérida Móvil con correo confirmado (en la app oficial)", obligatorio: true },
    ],
    pasos: [
      { orden: 1, titulo: "Confirma tu ubicación", canal: "en_linea" },
      { orden: 2, titulo: "Obtén tu folio", canal: "en_linea" },
      { orden: 3, titulo: "Dale seguimiento en «Mis reportes»", canal: "en_linea" },
    ],
    canalesDeAtencion: [CANAL_APP],
    costo: { tipo: "pendiente" },
    palabrasClave: ["bache", "hoyo", "hoyo en la calle", "pavimento", "reportar bache", "Mérida Móvil"],
  },
  {
    ...base,
    id: "reportes-rapidos",
    nombre: "Reportes rápidos",
    categoria: "reportes",
    descripcion:
      "«Confirma tu ubicación, captura la información, agrega fotos o video y obtén tu folio.» Módulo de reportes guiados de Mérida Móvil.",
    dependencia: "Ayuntamiento de Mérida (Mérida Móvil)",
    sistemaDeOrigen: "Mérida Móvil",
    fuenteOficial: fuente("Mérida Móvil · ficha de Google Play", PLAY_MERIDA_MOVIL, "2026-10-15"),
    estadoDeInformacion: "verificada",
    rutaInterna: "/reportes",
    tipoDeRecorrido: "reporte",
    requisitos: null,
    pasos: [
      { orden: 1, titulo: "Confirma tu ubicación", canal: "en_linea" },
      { orden: 2, titulo: "Captura la información", canal: "en_linea" },
      { orden: 3, titulo: "Agrega fotos o video", canal: "en_linea" },
      { orden: 4, titulo: "Obtén tu folio", canal: "en_linea" },
    ],
    canalesDeAtencion: [CANAL_APP],
    palabrasClave: ["reporte", "reportar", "folio", "Mérida Móvil", "luminaria", "rejilla", "basura"],
  },
  {
    ...base,
    id: "desazolve-de-rejilla",
    nombre: "Desazolve de rejilla",
    categoria: "reportes",
    descripcion: "Reporte al instante de Mérida Móvil para rejillas o drenaje pluvial que necesitan desazolve.",
    dependencia: "Ayuntamiento de Mérida (Mérida Móvil)",
    sistemaDeOrigen: "Mérida Móvil",
    fuenteOficial: fuente("Mérida Móvil · historial de versiones (3.1.0)", APP_STORE_MERIDA_MOVIL, "2024-12-26"),
    estadoDeInformacion: "verificada",
    rutaInterna: "/reportes/nuevo/desazolve_rejilla",
    tipoDeRecorrido: "reporte",
    requisitos: [{ nombre: "Confirmar la ubicación de la rejilla en el mapa", obligatorio: true }],
    pasos: null,
    canalesDeAtencion: [CANAL_APP],
    palabrasClave: ["rejilla", "coladera", "encharcamiento", "inundación", "desazolve"],
  },
  {
    ...base,
    id: "basura-en-via-publica",
    nombre: "Basura en vía pública",
    categoria: "reportes",
    descripcion: "Reporte al instante de Mérida Móvil «con solo confirmar tu ubicación». Es distinto de la queja por falta de recolección.",
    dependencia: "Ayuntamiento de Mérida (Mérida Móvil)",
    sistemaDeOrigen: "Mérida Móvil",
    fuenteOficial: fuente("Mérida Móvil · descripción en App Store", APP_STORE_MERIDA_MOVIL, "2026-10-16"),
    estadoDeInformacion: "pendiente",
    rutaInterna: "/reportes/nuevo/basura_via_publica",
    tipoDeRecorrido: "reporte",
    requisitos: null,
    pasos: null,
    canalesDeAtencion: [CANAL_APP],
    palabrasClave: ["basura", "cacharros", "tiradero", "basura en la calle"],
    notas: "Sólo aparece en la descripción de App Store; no se publica la fecha en que se agregó.",
  },
  {
    ...base,
    id: "catalogo-de-reportes",
    nombre: "Catálogo de reportes",
    categoria: "reportes",
    descripcion: "«Una amplia gama de temas que ahora podrás reportar desde la app»: animal muerto, bache, limpieza de parques y jardines, luminaria, queja por falta de recolección de basura y otros.",
    dependencia: "Ayuntamiento de Mérida (Mérida Móvil)",
    sistemaDeOrigen: "Mérida Móvil",
    fuenteOficial: fuente("Mérida Móvil · ficha de Google Play", PLAY_MERIDA_MOVIL, "2026-10-15"),
    estadoDeInformacion: "verificada",
    rutaInterna: "/reportes",
    tipoDeRecorrido: "reporte",
    requisitos: null,
    pasos: null,
    canalesDeAtencion: [CANAL_APP],
    palabrasClave: ["tipos de reporte", "animal muerto", "parques", "jardines", "luminaria", "recolección de basura"],
    notas: "La lista completa de temas no se ve en las capturas oficiales.",
  },
  {
    ...base,
    id: "mis-reportes",
    nombre: "Mis reportes",
    categoria: "reportes",
    descripcion:
      "Seguimiento de tus reportes «desde el inicio hasta su atención», con estatus Registrado, En proceso de atención, Solucionado y Motivo de cancelación, filtros por fecha y búsqueda por folio.",
    dependencia: "Ayuntamiento de Mérida (Mérida Móvil)",
    sistemaDeOrigen: "Mérida Móvil",
    fuenteOficial: fuente("Mérida Móvil · ficha de Google Play", PLAY_MERIDA_MOVIL, "2026-10-15"),
    estadoDeInformacion: "verificada",
    rutaInterna: "/reportes/mis-reportes",
    tipoDeRecorrido: "informativo",
    requisitos: null,
    pasos: null,
    canalesDeAtencion: [CANAL_APP],
    palabrasClave: ["folio", "seguimiento", "estatus", "mis reportes", "consultar reporte"],
  },
  {
    ...base,
    id: "expediente-digital",
    nombre: "Expediente Digital",
    categoria: "atencion_ciudadana",
    categoriasSecundarias: ["regulaciones"],
    descripcion:
      "Resguarda documentos e información para acreditar tu identidad ante el Ayuntamiento, iniciar trámites, darles seguimiento y descargar documentos. En el prototipo se usa un expediente FICTICIO.",
    dependencia: "Subdirección de Mejora Regulatoria (MIDigital)",
    sistemaDeOrigen: "Expediente Digital (MIDigital)",
    fuenteOficial: fuente("Expediente Digital · página de acceso", "https://expedientedigital.merida.gob.mx/"),
    estadoDeInformacion: "verificada",
    rutaInterna: "/expediente",
    tipoDeRecorrido: "consulta_documental",
    requisitos: null,
    pasos: null,
    canalesDeAtencion: [
      { tipo: "en_linea", etiqueta: "Expediente Digital", valor: "https://expedientedigital.merida.gob.mx/", verificado: true, fuente: "https://expedientedigital.merida.gob.mx/" },
    ],
    palabrasClave: ["expediente", "mis documentos", "identidad digital", "MIDigital", "documentos"],
    notas: "Las funciones internas requieren sesión y no se observaron; el prototipo nunca pide CURP, INE ni comprobantes reales.",
  },
  {
    ...base,
    id: "visor-urbano",
    nombre: "Visor Urbano",
    categoria: "territorio",
    descripcion:
      "Mapa digital anunciado con «75 capas de información urbana y catastral». El prototipo no tiene acceso a capas oficiales: su mapa sólo muestra incidencias de demostración y ubicaciones verificadas.",
    dependencia: "MIDigital",
    sistemaDeOrigen: "Visor Urbano (MIDigital)",
    fuenteOficial: fuente("Sala de prensa · Nota 12522 (MIDigital)", NOTA_MIDIGITAL, "2026-08-11"),
    estadoDeInformacion: "pendiente",
    rutaInterna: "/mapa",
    tipoDeRecorrido: "consulta_territorial",
    requisitos: null,
    pasos: null,
    canalesDeAtencion: [
      { tipo: "en_linea", etiqueta: "Visor Urbano", valor: "https://visorurbano.merida.gob.mx/", verificado: false, fuente: NOTA_MIDIGITAL },
    ],
    palabrasClave: ["mapa", "visor", "capas", "catastro", "uso de suelo", "geoportal"],
    notas: "El sitio no se pudo consultar el 2026-10-17 (bloqueo antibots); no se inventan capas ni límites.",
  },
  {
    ...base,
    id: "registro-visitas-domiciliarias",
    nombre: "Registro de Visitas Domiciliarias",
    categoria: "visitas_domiciliarias",
    descripcion:
      "Consulta las visitas domiciliarias que realiza el Ayuntamiento (inspección, notificación, peritaje, recaudación, verificación y visita): objetivo, quién la realiza, derechos y obligaciones.",
    dependencia: "Subdirección de Mejora Regulatoria (Portal Ciudadano)",
    sistemaDeOrigen: "Portal Ciudadano (MIDigital)",
    fuenteOficial: fuente("Portal Ciudadano · Visitas domiciliarias", "https://portalciudadano.merida.gob.mx/InspeccionesEnLinea/inspecciones"),
    estadoDeInformacion: "verificada",
    rutaInterna: "/servicios/registro-visitas-domiciliarias",
    tipoDeRecorrido: "verificacion",
    requisitos: null,
    pasos: null,
    canalesDeAtencion: [
      {
        tipo: "en_linea",
        etiqueta: "Registro de Visitas Domiciliarias",
        valor: "https://portalciudadano.merida.gob.mx/InspeccionesEnLinea/inspecciones",
        verificado: true,
      },
    ],
    palabrasClave: ["visita", "inspección", "inspector", "verificación", "me van a visitar"],
    notas: "El listado oficial tenía 119 visitas el 2026-10-17.",
  },
  {
    ...base,
    id: "padron-visitadores",
    nombre: "Padrón de Visitadoras y Visitadores",
    categoria: "visitas_domiciliarias",
    descripcion:
      "Verifica la identidad de quien te visita (inspector, interventor, notificador, perito, recaudador, verificador o visitador). En la demostración se usan personas FICTICIAS.",
    dependencia: "Subdirección de Mejora Regulatoria (Portal Ciudadano)",
    sistemaDeOrigen: "Portal Ciudadano (MIDigital)",
    fuenteOficial: fuente("Portal Ciudadano · Padrón de visitadores", "https://portalciudadano.merida.gob.mx/InspectoresEnLinea/inspectores"),
    estadoDeInformacion: "verificada",
    rutaInterna: "/servicios/padron-visitadores",
    tipoDeRecorrido: "verificacion",
    requisitos: null,
    pasos: null,
    canalesDeAtencion: [
      {
        tipo: "en_linea",
        etiqueta: "Padrón oficial",
        valor: "https://portalciudadano.merida.gob.mx/InspectoresEnLinea/inspectores",
        verificado: true,
      },
    ],
    palabrasClave: ["inspector", "visitador", "verificar identidad", "credencial", "quién me visita"],
    notas: "El padrón oficial publica fotografía y nombre de personas servidoras públicas; esos datos no se copiaron al prototipo.",
  },
  {
    ...base,
    id: "registro-regulaciones",
    nombre: "Registro de Regulaciones",
    categoria: "regulaciones",
    descripcion:
      "Consulta las regulaciones municipales con su objeto, tipo de normativa, fechas de emisión, publicación y vigencia, y el enlace a la Gaceta.",
    dependencia: "Subdirección de Mejora Regulatoria (Portal Ciudadano)",
    sistemaDeOrigen: "Portal Ciudadano (MIDigital)",
    fuenteOficial: fuente("Portal Ciudadano · Registro de Regulaciones", "https://portalciudadano.merida.gob.mx/RegulacionesEnLinea/regulaciones"),
    estadoDeInformacion: "verificada",
    rutaInterna: "/servicios/registro-regulaciones",
    tipoDeRecorrido: "consulta_documental",
    requisitos: null,
    pasos: null,
    canalesDeAtencion: [
      {
        tipo: "en_linea",
        etiqueta: "Registro de Regulaciones",
        valor: "https://portalciudadano.merida.gob.mx/RegulacionesEnLinea/regulaciones",
        verificado: true,
      },
    ],
    palabrasClave: ["reglamento", "regulación", "normatividad", "ley", "gaceta"],
    notas: "El registro oficial tenía 281 regulaciones el 2026-10-17.",
  },
  {
    ...base,
    id: "demanda-ciudadana",
    nombre: "Demanda ciudadana",
    categoria: "atencion_ciudadana",
    categoriasSecundarias: ["regulaciones"],
    descripcion:
      "Presenta una demanda si te negaron una gestión sin causa justificada o si no se cumplió lo establecido en la ficha de un trámite. Puede presentarse con sesión o de forma anónima.",
    dependencia: "Subdirección de Mejora Regulatoria (Portal Ciudadano)",
    sistemaDeOrigen: "Portal Ciudadano (MIDigital)",
    fuenteOficial: fuente("Portal Ciudadano · Demanda ciudadana", "https://portalciudadano.merida.gob.mx/demanda/demanda-ciudadana/ciudadano"),
    estadoDeInformacion: "verificada",
    rutaInterna: "/servicios/demanda-ciudadana/iniciar",
    tipoDeRecorrido: "formulario",
    recorridoDemoId: "demanda-ciudadana-demo",
    requisitos: null,
    pasos: null,
    canalesDeAtencion: [
      {
        tipo: "en_linea",
        etiqueta: "Formulario oficial",
        valor: "https://portalciudadano.merida.gob.mx/demanda/demanda-ciudadana/ciudadano",
        verificado: true,
      },
    ],
    palabrasClave: ["queja", "demanda", "me negaron el trámite", "incumplimiento", "protesta ciudadana"],
  },
  {
    ...base,
    id: "linea-mujer-app",
    nombre: "Línea Mujer (app)",
    categoria: "bienestar",
    descripcion:
      "App del Ayuntamiento con subtítulo «Botón de Pánico» para llamar a Línea Mujer. El prototipo nunca envía alertas, ubicación ni mensajes reales.",
    dependencia: "Instituto de las Mujeres",
    sistemaDeOrigen: "App Línea Mujer",
    fuenteOficial: fuente("App Store · Línea Mujer", "https://apps.apple.com/mx/app/l%C3%ADnea-mujer/id1293535345"),
    estadoDeInformacion: "verificada",
    rutaInterna: "/bienestar/linea-mujer",
    tipoDeRecorrido: "informativo",
    requisitos: null,
    pasos: null,
    canalesDeAtencion: [
      {
        tipo: "app",
        etiqueta: "Línea Mujer (iOS y Android)",
        valor: "https://apps.apple.com/mx/app/l%C3%ADnea-mujer/id1293535345",
        verificado: true,
      },
    ],
    palabrasClave: ["Línea Mujer", "violencia", "mujeres", "botón de pánico", "ayuda"],
  },
];
