/**
 * Ingesta del conocimiento del asistente: convierte las fuentes oficiales guardadas en data/sources/
 * y el catálogo generado en pasajes (chunks) con su fuente. Todo es puro (sin red ni disco) para
 * poder probarlo; el script scripts/construir-conocimiento.ts hace la lectura/escritura.
 *
 * Regla: sólo se escribe lo que dicen las fuentes. Lo que una fuente no trae no se rellena.
 */
import { z } from "zod";
import { LIMITES_CONOCIMIENTO, type Pasaje } from "../../shared/asistente/conocimiento";

export const URL_DEPENDENCIAS = "https://merida.gob.mx/municipio/portal/gobierno/dependencias.php";
export const FUENTE_DEPENDENCIAS = "Portal del Ayuntamiento de Mérida · Dependencias Municipales";

export type TipoArea = "cabildo" | "presidencia" | "direccion" | "secretaria" | "unidad" | "instituto_u_organismo";

export interface AreaMunicipal {
  slug: string;
  nombre: string;
  url: string;
  tipo: TipoArea;
}

const ETIQUETA_TIPO: Record<TipoArea, { singular: string; plural: string }> = {
  cabildo: { singular: "Cabildo", plural: "Cabildo" },
  presidencia: { singular: "Presidencia", plural: "Presidencia" },
  direccion: { singular: "Dirección", plural: "Direcciones" },
  secretaria: { singular: "Secretaría", plural: "Secretarías" },
  unidad: { singular: "Unidad", plural: "Unidades" },
  instituto_u_organismo: { singular: "Instituto u organismo", plural: "Institutos y organismos" },
};

function limpiar(texto: string): string {
  return texto
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<svg[\s\S]*?<\/svg>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&aacute;/g, "á")
    .replace(/&eacute;/g, "é")
    .replace(/&iacute;/g, "í")
    .replace(/&oacute;/g, "ó")
    .replace(/&uacute;/g, "ú")
    .replace(/&ntilde;/g, "ñ")
    .replace(/\s+/g, " ")
    .trim();
}

export function clasificarArea(slug: string, nombre: string): TipoArea {
  if (slug === "cabildo") return "cabildo";
  if (slug === "presidencia") return "presidencia";
  if (/^direcci[oó]n\b/i.test(nombre)) return "direccion";
  if (/^secretar[ií]a\b/i.test(nombre)) return "secretaria";
  if (/^unidad\b/i.test(nombre)) return "unidad";
  return "instituto_u_organismo";
}

/** Áreas de la lista «Área Municipal» de la página de dependencias, en el orden publicado. */
export function extraerAreas(html: string): AreaMunicipal[] {
  const inicio = html.indexOf("</select>", html.indexOf('id="slctDependencias"'));
  if (inicio < 0) throw new Error("No se encontró el selector de dependencias en la página guardada.");
  const fin = html.indexOf("<footer", inicio);
  const segmento = html.slice(inicio, fin < 0 ? undefined : fin);
  const patron = /<a [^>]*href="(https:\/\/merida\.gob\.mx\/municipio\/portal\/gobierno\/(?:dependencia\/([a-z-]+)\.php|cabildo\/(cabildo)\.php))"[^>]*>([\s\S]*?)<\/a>/g;
  const areas: AreaMunicipal[] = [];
  const vistas = new Set<string>();
  for (const coincidencia of segmento.matchAll(patron)) {
    const url = coincidencia[1] ?? "";
    const slug = coincidencia[2] ?? coincidencia[3] ?? "";
    const nombre = limpiar(coincidencia[4] ?? "");
    if (!slug || !nombre || vistas.has(slug)) continue;
    vistas.add(slug);
    areas.push({ slug, nombre, url, tipo: clasificarArea(slug, nombre) });
  }
  return areas;
}

// --- Catálogo de servicios ---

const CanalSchema = z.object({ etiqueta: z.string(), valor: z.string(), verificado: z.boolean().optional() });
const ServicioSchema = z.object({
  id: z.string(),
  clave: z.string().optional(),
  nombre: z.string(),
  nombreCiudadano: z.string().optional(),
  descripcion: z.string().optional(),
  dependencia: z.string(),
  modalidadOficial: z.string().optional(),
  estadoDeInformacion: z.enum(["verificada", "pendiente", "demostracion"]),
  rutaInterna: z.string().optional(),
  fuenteOficial: z.object({ nombre: z.string(), url: z.string().optional(), fechaConsulta: z.string().optional() }),
  costo: z.object({ tipo: z.string(), texto: z.string().optional() }).nullable().optional(),
  tiempoDeRespuesta: z.string().nullable().optional(),
  requisitos: z.array(z.object({ nombre: z.string() })).nullable().optional(),
  pasos: z.array(z.object({ orden: z.number(), titulo: z.string() })).nullable().optional(),
  canalesDeAtencion: z.array(CanalSchema).nullable().optional(),
});
export type ServicioFuente = z.infer<typeof ServicioSchema>;

export function leerServicios(datos: unknown): ServicioFuente[] {
  return z.array(ServicioSchema).parse(datos);
}

/** Cómo aparece el área del catálogo (primer segmento de «Área · Subárea») en la lista oficial. */
const AREA_DE_CATALOGO: Record<string, string> = {
  "Catastro": "catastro",
  "Desarrollo Urbano": "desarrollo-urbano",
  "Gobernación": "gobernacion",
  "Bienestar Humano": "bienestar",
  "Servicios Públicos": "servicios-publicos",
  "Finanzas y Tesorería": "finanzas-tesoreria",
  "DIF Municipal": "dif",
  "Prosperidad y Bienestar Económico": "prosperidad",
  "Identidad y Cultura": "cultura",
  "Obras Públicas": "obras-publicas",
  "Desarrollo Social y Combate a la Pobreza": "desarrollo-social",
  "Unidad de Medio Ambiente y Bienestar Animal": "medioambiente",
  "Secretaría Municipal": "secretaria-municipal",
  "Instituto de las Mujeres": "mujeres",
  "Policía Municipal": "policia-municipal",
  "Administración": "administracion",
  "Unidad de Turismo": "turismo",
  "Secretaría de Participación y Atención Ciudadana": "participacion-atencion",
  "Unidad de Transparencia": "transparencia",
  "Innovación y Gobierno Inteligente": "digi",
  "Contraloría Municipal": "contraloria",
};

export function slugDeAreaCatalogo(dependencia: string): string | null {
  const primera = dependencia.split(" · ")[0]?.trim() ?? "";
  return AREA_DE_CATALOGO[primera] ?? null;
}

// --- Datos verificados con cita (investigación del 2026-10-17) ---

const HechoSchema = z.object({
  hecho: z.string(),
  valor: z.union([z.string(), z.number()]).transform(String),
  fuente: z.string(),
  estado: z.string(),
  fragmento: z.string().optional(),
  nota: z.string().optional(),
});
export type HechoFuente = z.infer<typeof HechoSchema>;

export function leerHechos(datos: unknown): HechoFuente[] {
  return z.object({ facts: z.array(HechoSchema) }).parse(datos).facts;
}

/** Hechos técnicos o vencidos que no sirven a la ciudadanía. */
const HECHO_NO_CIUDADANO = /\b(wms|proxy|rastreo|token|endpoint|contrase[ñn]a|css|paleta|banner|street view)\b|vencido/i;

const NOMBRES_SITIO: ReadonlyArray<readonly [RegExp, string]> = [
  [/portalciudadano\.merida\.gob\.mx/, "Portal Ciudadano (MIDigital)"],
  [/visorurbano\.merida\.gob\.mx/, "Visor Urbano de Mérida"],
  [/geoportal\.merida\.gob\.mx/, "Geoportal de Mérida"],
  [/expedientedigital\.merida\.gob\.mx/, "Expediente Digital de Mérida"],
  [/merida\.gob\.mx/, "Portal del Ayuntamiento de Mérida"],
];

/** Título legible y URL de una fuente de la investigación (las copias archivadas se avisan como tales). */
export function describirFuente(fuente: string): { titulo: string; url?: string } {
  const url = /https?:\/\/[^\s)]+/.exec(fuente)?.[0]?.replace(/[.,;]+$/, "");
  if (!url) return { titulo: "Fuente oficial del Ayuntamiento de Mérida" };
  const archivada = /web\.archive\.org\/web\/(\d{4})(\d{2})(\d{2})/.exec(url);
  const original = archivada ? /web\.archive\.org\/web\/\d+\/(https?:\/\/[^\s)]+)/.exec(url)?.[1] : url;
  const nombre = NOMBRES_SITIO.find(([patron]) => patron.test(original ?? url))?.[1] ?? new URL(original ?? url).hostname;
  return { titulo: archivada ? `${nombre} (copia archivada del ${archivada[1]}-${archivada[2]}-${archivada[3]})` : nombre, url };
}

// --- Pasajes ---

function recortar(texto: string, maximo: number = LIMITES_CONOCIMIENTO.maxCaracteresPasaje): string {
  const plano = texto.replace(/\s+/g, " ").trim();
  return plano.length <= maximo ? plano : `${plano.slice(0, maximo - 1).trimEnd()}…`;
}

function lista(nombres: readonly string[]): string {
  return nombres.join("; ");
}

export interface OpcionesPasajes {
  areas: readonly AreaMunicipal[];
  servicios: readonly ServicioFuente[];
  /** AAAA-MM-DD de la consulta de la página de dependencias. */
  fechaConsultaDependencias: string;
  /** Datos verificados con cita (sólo los «confirmados» se usan). */
  hechos?: readonly HechoFuente[];
  /** AAAA-MM-DD de la consulta de los hechos. */
  fechaConsultaHechos?: string;
}

function pasajesDeAreas({ areas, servicios, fechaConsultaDependencias }: OpcionesPasajes): Pasaje[] {
  const fuente = { titulo: FUENTE_DEPENDENCIAS, url: URL_DEPENDENCIAS, fechaConsulta: fechaConsultaDependencias };
  const porArea = new Map<string, ServicioFuente[]>();
  for (const servicio of servicios) {
    const slug = slugDeAreaCatalogo(servicio.dependencia);
    if (slug) porArea.set(slug, [...(porArea.get(slug) ?? []), servicio]);
  }

  const pasajes: Pasaje[] = areas.map((area) => {
    const propios = porArea.get(area.slug) ?? [];
    const ejemplos = propios.slice(0, 8).map((servicio) => servicio.nombreCiudadano ?? servicio.nombre);
    const catalogo =
      propios.length === 0
        ? "En el catálogo de esta plataforma no hay trámites registrados a cargo de esta área."
        : `En el catálogo de esta plataforma esta área tiene ${propios.length} ${propios.length === 1 ? "trámite o servicio" : "trámites y servicios"}. Ejemplos: ${lista(ejemplos)}.`;
    const tipo = ETIQUETA_TIPO[area.tipo].singular;
    return {
      id: `dependencia:${area.slug}`,
      tipo: "dependencia",
      titulo: area.nombre,
      texto: recortar(
        `${area.nombre}. Tipo de área: ${tipo}. Aparece en la lista de dependencias municipales del portal oficial del Ayuntamiento de Mérida. Su página oficial (ubicación de oficinas, directorio telefónico, sitios web, trámites y servicios): ${area.url}. ${catalogo}`,
      ),
      fuente,
    };
  });

  // Resumen de estructura: los conteos ya vienen hechos para que nadie tenga que contar de memoria.
  const porTipo = new Map<TipoArea, AreaMunicipal[]>();
  for (const area of areas) porTipo.set(area.tipo, [...(porTipo.get(area.tipo) ?? []), area]);
  const dependencias = areas.filter((area) => area.tipo !== "cabildo");
  const operativas = areas.filter((area) => area.tipo !== "cabildo" && area.tipo !== "presidencia");
  const orden: TipoArea[] = ["direccion", "secretaria", "unidad", "instituto_u_organismo", "presidencia", "cabildo"];

  pasajes.push({
    id: "estructura:resumen",
    tipo: "estructura",
    titulo: "Cuántas dependencias y áreas tiene el Ayuntamiento de Mérida",
    texto: recortar(
      `La lista oficial de áreas municipales publica ${areas.length} áreas: el Cabildo y ${dependencias.length} dependencias. ` +
        orden
          .filter((tipo) => porTipo.has(tipo))
          .map((tipo) => {
            const grupo = porTipo.get(tipo) ?? [];
            const etiqueta = grupo.length === 1 ? ETIQUETA_TIPO[tipo].singular : ETIQUETA_TIPO[tipo].plural;
            return `${etiqueta}: ${grupo.length}.`;
          })
          .join(" ") +
        ` Sin contar el Cabildo ni la Presidencia, son ${operativas.length} áreas (direcciones, secretarías, unidades, institutos y organismos). ` +
        "Si alguien pregunta en general por «direcciones» o «dependencias», aclara ambos números. Los conteos son los de la lista publicada; la lista oficial puede cambiar.",
    ),
    fuente,
  });

  for (const tipo of orden) {
    const grupo = porTipo.get(tipo);
    if (!grupo || grupo.length === 0 || tipo === "cabildo" || tipo === "presidencia") continue;
    const etiqueta = grupo.length === 1 ? ETIQUETA_TIPO[tipo].singular : ETIQUETA_TIPO[tipo].plural;
    pasajes.push({
      id: `estructura:${tipo}`,
      tipo: "estructura",
      titulo: `${etiqueta} del Ayuntamiento de Mérida (${grupo.length})`,
      texto: recortar(
        `El Ayuntamiento de Mérida tiene ${grupo.length} ${grupo.length === 1 ? ETIQUETA_TIPO[tipo].singular.toLowerCase() : ETIQUETA_TIPO[tipo].plural.toLowerCase()} en la lista oficial de áreas municipales. Son: ${lista(grupo.map((area) => area.nombre))}.` +
          (tipo === "direccion"
            ? ` Ojo: ${grupo.length} áreas llevan «Dirección» en su nombre; en total la lista oficial publica ${operativas.length} áreas sin contar el Cabildo ni la Presidencia (además de las direcciones hay secretarías, unidades, institutos y organismos).`
            : ""),
      ),
      fuente,
    });
  }
  return pasajes;
}

function pasajeDeServicio(servicio: ServicioFuente): Pasaje {
  const nombre = servicio.nombreCiudadano ?? servicio.nombre;
  const partes: string[] = [`${nombre}${servicio.clave ? ` (clave ${servicio.clave})` : ""}.`];
  if (servicio.nombreCiudadano && servicio.nombreCiudadano !== servicio.nombre) partes.push(`Nombre oficial: ${servicio.nombre}.`);
  partes.push(`Área responsable: ${servicio.dependencia}.`);
  if (servicio.modalidadOficial) partes.push(`Modalidad: ${servicio.modalidadOficial}.`);
  if (servicio.descripcion) partes.push(servicio.descripcion);
  if (servicio.costo && servicio.costo.tipo !== "pendiente") partes.push(`Costo: ${servicio.costo.texto ?? servicio.costo.tipo}.`);
  if (servicio.tiempoDeRespuesta) partes.push(`Tiempo de respuesta: ${servicio.tiempoDeRespuesta}.`);
  if (servicio.requisitos && servicio.requisitos.length > 0) partes.push(`Requisitos: ${lista(servicio.requisitos.slice(0, 10).map((requisito) => requisito.nombre))}.`);
  if (servicio.pasos && servicio.pasos.length > 0) {
    partes.push(`Pasos: ${servicio.pasos.slice(0, 6).map((paso) => `${paso.orden}. ${paso.titulo}`).join(" ")}`);
  }
  const canales = (servicio.canalesDeAtencion ?? []).filter((canal) => canal.verificado !== false).slice(0, 4);
  if (canales.length > 0) partes.push(`Atención: ${lista(canales.map((canal) => `${canal.etiqueta}: ${canal.valor}`))}.`);
  partes.push(servicio.estadoDeInformacion === "verificada" ? "Información verificada contra la ficha oficial." : "Algunos datos de esta ficha están pendientes de verificar: confirma en la fuente oficial.");
  return {
    id: `servicio:${servicio.id}`,
    tipo: "servicio",
    titulo: nombre,
    texto: recortar(partes.join(" ")),
    fuente: { titulo: servicio.fuenteOficial.nombre, ...(servicio.fuenteOficial.url ? { url: servicio.fuenteOficial.url } : {}), ...(servicio.fuenteOficial.fechaConsulta ? { fechaConsulta: servicio.fuenteOficial.fechaConsulta } : {}) },
    ...(servicio.rutaInterna ? { ruta: servicio.rutaInterna } : {}),
  };
}

/** Guía de la propia plataforma: qué se puede hacer y dónde. Sólo describe funciones que existen en la app. */
const FUENTE_PLATAFORMA = { titulo: "Guía de la plataforma" } as const;
const GUIA_PLATAFORMA: ReadonlyArray<{ id: string; titulo: string; texto: string; ruta?: string }> = [
  {
    id: "inicio",
    titulo: "Qué puedes hacer en la plataforma de servicios digitales de Mérida",
    texto:
      "Aquí puedes buscar trámites y servicios del Ayuntamiento, consultar requisitos y a qué área corresponden, levantar reportes ciudadanos (bache, luminaria, basura y más), ver el estado de tus reportes y gestiones, revisar un mapa de incidencias, guardar tu expediente de documentos, conocer programas de bienestar y acompañarte con Pekito, el asistente.",
    ruta: "/",
  },
  {
    id: "reportes",
    titulo: "Reportes ciudadanos: categorías y cómo se levantan",
    texto:
      "Las categorías de reporte son: Bache a la vista, Luminaria, Desazolve de rejilla, Basura en vía pública, Animal muerto, Parques y jardines y Recolección de basura. Se elige la categoría, se describe el problema, se marca la ubicación (con tu permiso puede usar tu ubicación o la marcas en el mapa), se puede agregar una foto y se envía. En «Mis reportes» ves el estado: Registrado, En proceso de atención, Solucionado o Cancelado. Si ya existe un reporte parecido cerca, la plataforma lo avisa para evitar duplicados.",
    ruta: "/reportes",
  },
  {
    id: "verificacion",
    titulo: "Verificación ciudadana de reportes",
    texto:
      "Otras personas pueden confirmar si un reporte coincide con lo que ven en la calle. La verificación ciudadana es independiente del estado municipal: un voto de la ciudadanía nunca cierra un reporte; sólo el área municipal cambia su estado.",
    ruta: "/mapa",
  },
  {
    id: "mapa",
    titulo: "Mapa / Visor Urbano",
    texto:
      "El mapa muestra incidencias de reportes en puntos, calor o celdas, con filtros por categoría, y una lista equivalente. Si el mapa no carga, la lista y los formularios siguen funcionando. Las capas de información territorial oficial sólo se muestran cuando hay acceso autorizado.",
    ruta: "/mapa",
  },
  {
    id: "servicios",
    titulo: "Trámites y servicios",
    texto:
      "El catálogo reúne trámites y servicios municipales con su área responsable, requisitos, costos, pasos y canales de atención, cada uno con su fuente oficial. Cuando un dato no está verificado, la ficha lo indica como pendiente de verificar. Puedes buscar con tus propias palabras, por ejemplo «bache en mi calle».",
    ruta: "/servicios",
  },
  {
    id: "gestiones",
    titulo: "Mis gestiones",
    texto:
      "«Mis gestiones» concentra el seguimiento de tus trámites, citas y pagos, con su folio y su estado. Desde ahí puedes retomar un borrador o consultar el detalle de cada gestión.",
    ruta: "/gestiones",
  },
  {
    id: "expediente",
    titulo: "Mi expediente",
    texto:
      "En «Mi expediente» guardas tu perfil y tus documentos para reutilizarlos. Antes de reutilizar un dato en un trámite, la plataforma te pide confirmar campo por campo. No compartas documentos reales de otras personas.",
    ruta: "/expediente",
  },
  {
    id: "participacion",
    titulo: "Participación y recompensas",
    texto:
      "Participar con reportes de calidad y verificaciones honestas suma puntos, que se aplican sólo cuando el reporte o la verificación se validan. Nadie gana puntos por verificar su propio reporte y los puntos no cambian la prioridad con la que se atiende un servicio.",
    ruta: "/participacion",
  },
  {
    id: "bienestar",
    titulo: "Bienestar, salud mental y Línea Mujer",
    texto:
      "La sección Bienestar reúne programas de salud y apoyo, acompañamiento emocional y Línea Mujer. La conversación de acompañamiento es privada: no se guarda y no la ve el asistente general. Si estás en peligro o en una emergencia, el botón de ayuda inmediata siempre está a la vista y muestra los canales verificados.",
    ruta: "/bienestar",
  },
];

function pasajesDeHechos(hechos: readonly HechoFuente[], fechaConsulta: string): Pasaje[] {
  const vistos = new Set<string>();
  const pasajes: Pasaje[] = [];
  for (const hecho of hechos) {
    if (hecho.estado !== "confirmado" || HECHO_NO_CIUDADANO.test(`${hecho.hecho} ${hecho.valor}`)) continue;
    const clave = `${hecho.hecho}|${hecho.valor}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    const fuente = describirFuente(hecho.fuente);
    const partes = [`${hecho.hecho}: ${hecho.valor}.`];
    if (hecho.fragmento) partes.push(`Texto publicado en la fuente: «${recortar(hecho.fragmento, 420)}»`);
    pasajes.push({
      id: `dato:${pasajes.length + 1}`,
      tipo: "dato",
      titulo: hecho.hecho,
      texto: recortar(partes.join(" ")),
      fuente: { titulo: fuente.titulo, ...(fuente.url ? { url: fuente.url } : {}), fechaConsulta },
    });
  }
  return pasajes;
}

export function construirPasajes(opciones: OpcionesPasajes): Pasaje[] {
  const plataforma: Pasaje[] = GUIA_PLATAFORMA.map((entrada) => ({
    id: `plataforma:${entrada.id}`,
    tipo: "plataforma",
    titulo: entrada.titulo,
    texto: recortar(entrada.texto),
    fuente: FUENTE_PLATAFORMA,
    ...(entrada.ruta ? { ruta: entrada.ruta } : {}),
  }));
  const datos = pasajesDeHechos(opciones.hechos ?? [], opciones.fechaConsultaHechos ?? opciones.fechaConsultaDependencias);
  return [...pasajesDeAreas(opciones), ...opciones.servicios.map(pasajeDeServicio), ...datos, ...plataforma];
}

/** Texto que se embebe de cada pasaje: título + texto. */
export function textoParaEmbedding(pasaje: Pick<Pasaje, "titulo" | "texto">): string {
  return `${pasaje.titulo}\n${pasaje.texto}`.slice(0, 6000);
}
