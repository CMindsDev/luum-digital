import type { CanalAtencion, FuenteConsultada, LineaAyuda, ProgramaBienestar, UbicacionServicio } from "@/types";

/**
 * Programas, líneas de ayuda y ubicaciones de bienestar.
 *
 * - Programas: fichas oficiales del Portal Ciudadano (consulta 2026-10-17). «verificada» sólo si la ficha
 *   se abrió (data/sources/portal-ciudadano/2026-10-17/fichas-detalle.json) o si su texto se re-verificó
 *   (MID-INMU-399: research/out/web-bienestar.json y verify-datos-criticos.json); las demás, «pendiente».
 *   La app «Línea Mujer» queda «pendiente»: sus fichas de tienda no coinciden sobre lo que hace el botón.
 * - Ubicaciones: sólo sedes con dirección publicada en las fichas MID-BIH-007, MID-BIH-016 y MID-INMU-370
 *   (dirección textual; sin coordenadas porque la fuente consultada no las expone).
 * - Líneas de ayuda: sólo números re-verificados (ver LINEAS_AYUDA).
 * - Contactos de oficina (correo y teléfono del área responsable) sólo si la ficha los publica y se
 *   re-verificaron en research/out/verify-datos-criticos.json (2026-10-17). No son líneas de crisis.
 */

const FECHA_CONSULTA = "2026-10-17";

function ficha(clave: string, numero: number, actualizacion?: string): FuenteConsultada {
  return {
    nombre: `Portal Ciudadano · Ficha ${clave}`,
    url: `https://portalciudadano.merida.gob.mx/TramitesEnLinea/detalle-tramite/${numero}`,
    fechaConsulta: FECHA_CONSULTA,
    ...(actualizacion ? { fechaActualizacionFuente: actualizacion } : {}),
  };
}

function modulo(nombre: string, fuente: string): CanalAtencion {
  return { tipo: "presencial", etiqueta: "Sede de atención", valor: nombre, verificado: true, fuente };
}

const F007 = ficha("MID-BIH-007", 7, "2026-09-25");
const F016 = ficha("MID-BIH-016", 16, "2026-09-29");
const F370 = ficha("MID-INMU-370", 370, "2026-09-29");
const F397 = ficha("MID-INMU-397", 397, "2026-09-29");
const F399 = ficha("MID-INMU-399", 399, "2026-09-29");
const F400 = ficha("MID-BIH-400", 400, "2026-09-02");

/** Contacto de oficina publicado por la ficha (re-verificado). No es una línea de crisis. */
function contacto(tipo: "telefono" | "correo", etiqueta: string, valor: string, fuente: string, horario?: string): CanalAtencion {
  return { tipo, etiqueta, valor, verificado: true, fuente, ...(horario ? { horario } : {}) };
}

export const PROGRAMAS_BIENESTAR: readonly ProgramaBienestar[] = [
  {
    id: "prog-apoyo-psicologico",
    nombre: "Apoyo Psicológico (centros Alma Nova)",
    area: "salud_mental",
    descripcion: "Brindar atención psicológica (adulto mayor), a niñas, niños, adolescentes y adultos.",
    dirigidoA: "Es necesario que las niñas y niños sean mayores de 5 años de edad.",
    canales: [
      // La ficha escribe «psicología@…» con tilde en el texto (errata); el mailto oficial no la lleva.
      contacto("correo", "Correo para pedir cita (área de Salud Mental)", "psicologia@merida.gob.mx", F007.url),
      // Conmutador del área. La ficha no publica una extensión para citas (la 81951 es del módulo de Caucel).
      contacto("telefono", "Teléfono del área de Salud Mental (conmutador)", "999 942 00 00", F007.url, "Lunes a viernes, 08:00 a 15:00"),
      ...["Alma Nova Sede Norte", "Alma Nova Sede Oriente", "Alma Nova Sede Poniente", "Alma Nova Sede Sur", "Unidad Deportiva Caucel"].map((n) =>
        modulo(n, F007.url),
      ),
    ],
    fuente: F007,
    estadoDeInformacion: "verificada",
    servicioId: "mid-bih-007",
  },
  {
    id: "prog-atencion-psicologica",
    nombre: "Atención Psicológica en módulos de salud",
    area: "salud_mental",
    descripcion:
      "Atención psicológica presencial y gratuita en módulos médicos municipales de la ciudad y las comisarías (Departamento de Salud Mental).",
    canales: [
      "Centro de Atención Médica a la Mujer",
      "Centro de Desarrollo Integral Sara Mena de Correa",
      "Módulo Médico Azcorra",
      "Módulo Médico en Comisaría Caucel",
      "Módulo Médico en Comisaría Cholul",
      "Módulo Médico en Comisaría Sitpach",
      "Módulo Médico Melitón Salazar",
      "Módulo Médico Mulsay",
      "Módulo Médico San Antonio Xluch",
      "Módulo Médico Santa Rosa",
      "Módulo Médico Vergel",
      "Módulo Médico en Comisaría San José Tzal",
      "Módulo Médico Manuel Crescencio Rejón",
      "Módulo Médico Renacimiento",
    ].map((n) => modulo(n, F016.url)),
    fuente: F016,
    estadoDeInformacion: "verificada",
    servicioId: "mid-bih-016",
  },
  {
    id: "prog-ruta-salud-mental",
    nombre: "Ruta de la Salud Mental",
    area: "salud_mental",
    descripcion:
      "Programa que lleva orientación y acompañamiento psicológico a las universidades mediante un consultorio móvil (según nota de prensa; no publica calendario ni canal de solicitud).",
    canales: [],
    fuente: {
      nombre: "Sala de prensa del Ayuntamiento de Mérida · Nota 12647",
      url: "https://prensa.merida.gob.mx/12647/Cecilia-Patron-fortalece-la-Ruta-de-la-Salud-Mental-con-evaluaciones-gratuitas-para-estudiantes-universitarios/amp",
      fechaConsulta: FECHA_CONSULTA,
      // Fecha visible de la nota («Lunes 12 de Octubre de 2026»); su JSON-LD dice 2026-10-16. No implica vigencia.
      fechaActualizacionFuente: "2026-10-12",
    },
    estadoDeInformacion: "pendiente",
  },
  {
    id: "prog-linea-mujer",
    nombre: "Línea Mujer (Línea Telefónica de Atención de la Violencia contra las Mujeres)",
    area: "mujeres",
    descripcion:
      "Brindar servicios esenciales de atención inmediata y de primer contacto a mujeres en situación de violencias en razón de género a través de asistencia telefónica las 24 horas del día los 7 días de la semana.",
    dirigidoA:
      "Se atienen todas las llamadas entrantes, sin embargo para la canalización de los servicios únicamente aplica a las mujeres del Municipio de Mérida y sus comisarías que se encuentren en alguna situación de violencias.",
    canales: [],
    fuente: F397,
    estadoDeInformacion: "verificada",
    servicioId: "mid-inmu-397",
  },
  {
    id: "prog-atencion-mujeres-violencia",
    nombre: "Atención Especializada para mujeres en situación de Violencia",
    area: "mujeres",
    descripcion: "Atención presencial especializada del Instituto de las Mujeres para mujeres en situación de violencia.",
    canales: [
      contacto("telefono", "Teléfono del área responsable (Instituto de las Mujeres)", "999 924 02 96", F370.url, "Lunes a viernes, 08:00 a 18:00"),
      contacto("correo", "Correo del área responsable", "tramites.inm@merida.gob.mx", F370.url),
      ...["Instituto de las Mujeres", "Instituto de la Mujer sede oriente", "Instituto de la Mujer sede poniente", "Instituto de la Mujer sede sur"].map((n) =>
        modulo(n, F370.url),
      ),
    ],
    fuente: F370,
    estadoDeInformacion: "verificada",
    servicioId: "mid-inmu-370",
  },
  {
    id: "prog-refugio",
    nombre: "Refugio y atención integral a mujeres con o sin hijas e hijos en situación de violencia feminicida",
    area: "mujeres",
    descripcion:
      "Ofrecer refugio temporal y seguro a mujeres con o sin hijas e hijos en situación de violencia extrema, que no cuenten con un sitio confiable en donde puedan habitar. Gratuito. El ingreso es previa valoración del personal del Refugio; su ubicación no se publica.",
    canales: [
      modulo("Instituto de las Mujeres", F399.url),
      contacto("telefono", "Teléfono del área responsable (Instituto de las Mujeres)", "999 924 02 96", F399.url, "Lunes a viernes, 08:00 a 18:00"),
    ],
    fuente: F399,
    estadoDeInformacion: "verificada",
    servicioId: "mid-inmu-399",
  },
  {
    id: "prog-app-linea-mujer",
    nombre: "App oficial «Línea Mujer»",
    area: "mujeres",
    descripcion:
      "Aplicación del Ayuntamiento para llamar a la Línea Mujer con un botón (según su ficha en App Store y el sitio del Instituto). Su ficha de Google Play menciona además alertas por SMS con la ubicación a contactos de confianza: las fuentes no coinciden. Este prototipo no la integra ni la probó.",
    canales: [
      { tipo: "app", etiqueta: "App Store (iOS)", valor: "https://apps.apple.com/mx/app/l%C3%ADnea-mujer/id1293535345", verificado: true, fuente: "https://apps.apple.com/mx/app/l%C3%ADnea-mujer/id1293535345" },
      {
        tipo: "app",
        etiqueta: "Google Play (Android)",
        valor: "https://play.google.com/store/apps/details?id=com.ayuntamientodemerida.linearosa",
        verificado: true,
        fuente: "https://play.google.com/store/apps/details?id=com.ayuntamientodemerida.linearosa&hl=es_419&gl=MX",
      },
    ],
    fuente: {
      nombre: "App Store · «Línea Mujer» (Ayuntamiento de Mérida)",
      url: "https://apps.apple.com/mx/app/l%C3%ADnea-mujer/id1293535345",
      fechaConsulta: FECHA_CONSULTA,
    },
    estadoDeInformacion: "pendiente",
  },
  {
    id: "prog-medico-domicilio",
    nombre: "Médico a Domicilio",
    area: "salud",
    descripcion:
      "El médico a domicilio acude a las colonias y comisarías del Municipio de Mérida, con la finalidad de acercar los servicios médicos a personas de vulnerabilidad.",
    canales: [modulo("Subdirección de Salud", F400.url)],
    fuente: F400,
    estadoDeInformacion: "verificada",
    servicioId: "mid-bih-400",
  },
  {
    id: "prog-atencion-medica",
    nombre: "Atención Médica a Población Abierta",
    area: "salud",
    descripcion:
      "Atención médica general a la población, en los módulos médicos municipales ubicados en la ciudad y las comisarías del Municipio de Mérida, a bajo costo.",
    canales: [],
    fuente: ficha("MID-BIH-015", 15),
    estadoDeInformacion: "pendiente",
    servicioId: "mid-bih-015",
  },
  {
    id: "prog-academia-ingles",
    nombre: "Academia Municipal de Inglés",
    area: "educacion",
    descripcion:
      "Impartir clases presenciales en la Academia Municipal de Inglés y las sedes establecidas, a las y los estudiantes de Mérida, como parte del refuerzo al Plan Municipal para la Educación.",
    canales: [],
    fuente: ficha("MID-BIH-005", 5),
    estadoDeInformacion: "pendiente",
    servicioId: "mid-bih-005",
  },
  {
    id: "prog-beca-excelencia",
    nombre: "Beca de Excelencia Universitaria",
    area: "educacion",
    descripcion:
      "Otorgar apoyo económico a las y los jóvenes universitarios destacados, que cursan a partir del segundo año, en escuelas y universidades públicas y privadas del Municipio de Mérida.",
    canales: [],
    fuente: ficha("MID-BIH-037", 37),
    estadoDeInformacion: "pendiente",
    servicioId: "mid-bih-037",
  },
  {
    id: "prog-propedeuticos",
    nombre: "Cursos propedéuticos EXANI I y EXANI II",
    area: "educacion",
    descripcion:
      "Apoyar a los estudiantes del municipio con cursos propedéuticos gratuitos para que ingresen a escuelas públicas de los niveles medio superior y superior.",
    canales: [],
    fuente: ficha("MID-BIH-401", 401),
    estadoDeInformacion: "pendiente",
    servicioId: "mid-bih-401",
  },
  {
    id: "prog-natacion",
    nombre: "Clases de Natación en el Centro Acuático de Mérida",
    area: "deporte",
    descripcion: "Impartir clases de natación en el Centro Acuático de Mérida para las y los ciudadanos del Municipio.",
    canales: [],
    fuente: ficha("MID-BIH-034", 34),
    estadoDeInformacion: "pendiente",
    servicioId: "mid-bih-034",
  },
  {
    id: "prog-curso-verano",
    nombre: "Curso de Verano",
    area: "deporte",
    descripcion: "Curso de verano presencial de dos semanas de lunes a viernes para niños de 6 a 13 años cumplidos.",
    canales: [],
    fuente: ficha("MID-BIH-028", 28),
    estadoDeInformacion: "pendiente",
    servicioId: "mid-bih-028",
  },
];

/**
 * Líneas de ayuda humana. Sólo números confirmados contra su fuente oficial en
 * research/out/verify-datos-criticos.json (2026-10-17), salvo Línea de la Vida: fuente oficial
 * identificada en gob.mx pero no legible de forma automática (verificado: false, se rotula así).
 * 911 va primero. Alma Nova es con cita: no es una línea de crisis.
 */
export const LINEAS_AYUDA: readonly LineaAyuda[] = [
  {
    id: "emergencias-911",
    nombre: "Emergencias 911",
    telefono: "911",
    telefonoMarcable: "911",
    descripcion: "Si tu vida o la de alguien más está en riesgo inmediato.",
    ambito: "nacional",
    tipo: "emergencia",
    fuente: {
      nombre: "Portal Ciudadano — aviso «Información y emergencias»",
      url: "https://portalciudadano.merida.gob.mx/",
      fechaConsulta: "2026-10-17",
    },
    verificado: true,
  },
  {
    id: "linea-mujer",
    nombre: "Línea Mujer",
    telefono: "800 455 76 72",
    telefonoMarcable: "8004557672",
    descripcion: "Atención inmediata y de primer contacto a mujeres en situación de violencias en razón de género. Gratuita.",
    ambito: "municipal",
    disponibilidad: "24 horas, los 7 días de la semana",
    tipo: "violencia",
    fuente: {
      nombre: "Portal Ciudadano — ficha MID-INMU-397",
      url: "https://portalciudadano.merida.gob.mx/TramitesEnLinea/detalle-tramite/397",
      fechaConsulta: "2026-10-17",
      fechaActualizacionFuente: "2026-09-29",
    },
    verificado: true,
  },
  {
    id: "linea-de-la-vida",
    nombre: "Línea de la Vida (CONASAMA)",
    telefono: "800 911 2000",
    telefonoMarcable: "8009112000",
    descripcion:
      "Línea nacional de orientación en salud mental y adicciones. Fuente oficial identificada en gob.mx; su contenido no pudo leerse de forma automática el 2026-10-17: confírmala antes de un uso real.",
    ambito: "nacional",
    tipo: "salud_mental",
    fuente: {
      nombre: "gob.mx — CONASAMA, «La Línea de la Vida, te escucha»",
      url: "https://www.gob.mx/conasama/articulos/linea-de-la-vida-800-911-2000",
      fechaConsulta: "2026-10-17",
    },
    verificado: false,
  },
  {
    id: "apoyo-psicologico-alma-nova",
    nombre: "Apoyo Psicológico — Alma Nova (con cita)",
    telefono: "999 942 00 00",
    telefonoMarcable: "9999420000",
    descripcion:
      "Atención psicológica gratuita del Ayuntamiento con cita: no es una línea de crisis. Es el conmutador del área de Salud Mental (la ficha no publica una extensión para citas). También por correo: psicologia@merida.gob.mx.",
    ambito: "municipal",
    disponibilidad: "Área responsable: lunes a viernes, 08:00 a 15:00",
    tipo: "salud_mental",
    fuente: {
      nombre: "Portal Ciudadano — ficha MID-BIH-007",
      url: "https://portalciudadano.merida.gob.mx/TramitesEnLinea/detalle-tramite/7",
      fechaConsulta: "2026-10-17",
      fechaActualizacionFuente: "2026-09-25",
    },
    verificado: true,
  },
  {
    id: "ayuntatel",
    nombre: "Ayuntatel",
    telefono: "999 924 4000 o 070",
    telefonoMarcable: "9999244000",
    descripcion: "Orientación y reportes de servicios municipales.",
    ambito: "municipal",
    tipo: "orientacion",
    fuente: {
      nombre: "Portal Ciudadano — aviso «Información y emergencias»",
      url: "https://portalciudadano.merida.gob.mx/",
      fechaConsulta: "2026-10-17",
    },
    verificado: true,
  },
  {
    id: "proteccion-civil",
    nombre: "Protección Civil",
    telefono: "999 928 8311",
    telefonoMarcable: "9999288311",
    descripcion: "Riesgos y contingencias en la ciudad.",
    ambito: "municipal",
    tipo: "emergencia",
    fuente: {
      nombre: "Portal Ciudadano — aviso «Información y emergencias»",
      url: "https://portalciudadano.merida.gob.mx/",
      fechaConsulta: "2026-10-17",
    },
    verificado: true,
  },
];

function sede(id: string, nombre: string, direccion: string, tipo: UbicacionServicio["tipo"], fuente: FuenteConsultada): UbicacionServicio {
  return { id, nombre, direccion, tipo, fuente, verificado: true };
}

/** Sedes con dirección textual publicada en las fichas (sin coordenadas: la fuente no las expone). */
export const UBICACIONES_SERVICIO: readonly UbicacionServicio[] = [
  sede("ub-almanova-norte", "Alma Nova Sede Norte", "Calle 8, No. Ext. Sin número, Entre 13, Col. José María Iturralda", "salud_mental", F007),
  sede("ub-almanova-oriente", "Alma Nova Sede Oriente", "Calle 14, No. Ext. Sin número, Entre 75, y 77, Col. San Antonio Kaua", "salud_mental", F007),
  sede("ub-almanova-poniente", "Alma Nova Sede Poniente", "Calle 5-D, No. Ext. Sin número, Entre 58, y 21, Col. Residencial Pensiones V etapa", "salud_mental", F007),
  sede("ub-almanova-sur", "Alma Nova Sede Sur", "Calle 155-A, No. Ext. Sin número, Entre 56, y 58, Col. Brisas de San José", "salud_mental", F007),
  sede("ub-ud-caucel", "Unidad Deportiva Caucel", "Calle 96, No. Ext. Sin número, Entre 31, y 39, Col. Ciudad Caucel", "salud_mental", F007),
  sede("ub-camm", "Centro de Atención Médica a la Mujer", "Calle 88-A, No. Ext. 311-D, Entre 141, y 143, Col. Emiliano Zapata Sur I y II", "salud_mental", F016),
  sede("ub-sara-mena", "Centro de Desarrollo Integral Sara Mena de Correa", "Calle 57, No. Ext. Sin número, Entre 46, Col. Fraccionamiento Fidel Velázquez", "salud_mental", F016),
  sede("ub-azcorra", "Módulo Médico Azcorra", "Calle 18, No. Ext. 571, Entre 71, y 71 A, Col. Azcorra", "salud_mental", F016),
  sede("ub-caucel", "Módulo Médico en Comisaría Caucel", "Calle 22, No. Ext. Sin número, Entre 21, y 23, Col. Caucel", "salud_mental", F016),
  sede("ub-cholul", "Módulo Médico en Comisaría Cholul", "Calle 21, Entre 20, y 22 A, Col. Cholul, Mérida", "salud_mental", F016),
  sede("ub-sitpach", "Módulo Médico en Comisaría Sitpach", "Calle 11, No. Ext. Sin número, Entre 8, y 10, Col. Sitpach", "salud_mental", F016),
  sede("ub-meliton", "Módulo Médico Melitón Salazar", "Calle 103, No. Ext. Sin número, Entre 64 I, y 64 J, Col. Melitón Salazar", "salud_mental", F016),
  sede("ub-mulsay", "Módulo Médico Mulsay", "Calle 61, No. Ext. Sin número, Entre 114, y 118, Col. Xoclán la Reja", "salud_mental", F016),
  sede("ub-xluch", "Módulo Médico San Antonio Xluch", "Calle 137, No. Ext. 125, Entre 72, y 74, Col. San Antonio Xluch", "salud_mental", F016),
  sede("ub-santa-rosa", "Módulo Médico Santa Rosa", "Calle 46, No. Ext. Sin número, Entre 97, y 95, Col. Santa Rosa", "salud_mental", F016),
  sede("ub-vergel", "Módulo Médico Vergel", "Calle 15 B, No. Ext. 236, Entre 10 C, y 10 B, Col. Vergel", "salud_mental", F016),
  sede("ub-tzal", "Módulo Médico en Comisaría San José Tzal", "Calle 23, No. Ext. Sin número, Entre 14, y 16, Col. San José Tzal", "salud_mental", F016),
  sede("ub-rejon", "Módulo Médico Manuel Crescencio Rejón", "Calle 25, No. Ext. Sin número, Entre 24, y 24 A, Col. Manuel Crescencio Rejón", "salud_mental", F016),
  sede("ub-renacimiento", "Módulo Médico Renacimiento", "Calle 163, No. Ext. Sin número, Entre 76, y 78, Col. Emilio Zapata Sur I y II", "salud_mental", F016),
  sede("ub-inmujeres", "Instituto de las Mujeres", "Calle 50, No. Ext. 550 A, Entre 71, Col. Centro", "mujeres", F370),
  sede("ub-inmujeres-oriente", "Instituto de la Mujer sede oriente", "Calle 57, No. Ext. Sin número, Entre 46, Col. Fidel Velázquez", "mujeres", F370),
  sede("ub-inmujeres-poniente", "Instituto de la Mujer sede poniente", "Calle 32, No. Ext. Sin número, Entre 21, Col. Fracc. Juan Pablo Ampliación II", "mujeres", F370),
  sede("ub-inmujeres-sur", "Instituto de la Mujer sede sur", "Calle 88-A, No. Ext. 311-D, Entre 141, y 143, Col. Emiliano Zapata Sur I y II", "mujeres", F370),
];
