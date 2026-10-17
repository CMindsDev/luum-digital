/**
 * Importador del Catálogo Municipal del prototipo.
 *
 *   npm run catalogo:importar
 *
 * Lee las instantáneas públicas del Portal Ciudadano (data/sources/portal-ciudadano/<fecha>/) y genera:
 * - src/data/catalogo/servicios.generated.json  (una ficha `Servicio` por trámite del listado)
 * - src/data/catalogo/cobertura.generated.json  (totales para la pantalla de cobertura)
 *
 * Reglas (AGENTS.md §2 y §6):
 * - Las 27 fichas abiertas (fichas-detalle.json) quedan "verificada" con requisitos, pasos, costo (texto
 *   literal), tiempo de respuesta y canales tal como aparecen. Las demás quedan "pendiente" con
 *   requisitos y pasos en null: la interfaz las muestra como pendientes de verificar.
 * - estadoDeIntegracion siempre "simulada": un enlace externo no es una integración.
 * - No se inventan costos, horarios, teléfonos ni requisitos.
 *
 * MAPEO DE CATEGORÍAS (21 del Portal Ciudadano -> CategoriaId del prototipo). La categoría principal es
 * la primera regla que aplica en este orden; las demás quedan como categorías secundarias:
 *   1. servicios públicos (sólo si el recorrido es "reporte")  -> reportes
 *   2. impuestos y contribuciones                               -> pagos
 *   3. apertura de negocios                                     -> negocios
 *   4. laboral                                                  -> empleo
 *   5. eventos culturales                                       -> cultura
 *   6. deporte                                                  -> deporte
 *   7. seguridad, legalidad y justicia                          -> seguridad
 *   8. educación                                                -> educacion
 *   9. salud, asistencia social, protección sanitaria           -> bienestar
 *  10. economía                                                 -> negocios
 *  11. medio ambiente, servicio de sanidad animal               -> medio_ambiente
 *  12. identidad -> cultura si la unidad es «Identidad y Cultura»; si no (constancias de identidad,
 *      población, cartilla) -> atencion_ciudadana. Ajuste documentado: mandar una constancia de
 *      identidad a «cultura» confundiría a la persona.
 *  13. territorio y vivienda, construcción                      -> territorio
 *  14. turismo                                                  -> turismo
 *  15. transparencia                                            -> regulaciones
 *  16. atención ciudadana, asistencia jurídica                  -> atencion_ciudadana
 *  17. servicios públicos (sin recorrido de reporte)            -> atencion_ciudadana
 * Excepciones: fichas transversales con 8 o más categorías (Ayuntatel, atención digital) ->
 * atencion_ciudadana; licencias de funcionamiento y apertura de empresas -> negocios; fichas de salud
 * mental y de atención a mujeres en situación de violencia -> bienestar.
 *
 * TIPO DE RECORRIDO (primera regla que aplica):
 *   a. Fichas sensibles (salud mental, violencia contra las mujeres) -> informativo, con ruta interna al
 *      módulo de bienestar: nunca se simulan citas ni solicitudes persistentes para ellas.
 *   b. Nombre que empieza con «Pago»                                 -> pago
 *   c. Servicios públicos 100% en línea de Servicios Públicos u Obras Públicas, o nombre con «reporte»
 *                                                                    -> reporte
 *   d. Cita o atención presencial con fecha (cita, agendar, visitas guiadas, consulta o atención médica)
 *                                                                    -> cita
 *   e. Categoría principal regulaciones                              -> consulta_documental
 *   f. Unidad Catastro o Desarrollo Urbano                           -> consulta_territorial
 *   g. Modalidad en línea (100% en línea, gestión o presolicitud)    -> formulario
 *   h. Resto                                                         -> informativo
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  CanalAtencion,
  CategoriaId,
  CoberturaCatalogo,
  CostoServicio,
  PasoServicio,
  Requisito,
  Servicio,
  TipoRecorrido,
} from "../src/types/catalogo";

const FECHA_CONSULTA = "2026-10-17";
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGEN = resolve(RAIZ, "data/sources/portal-ciudadano", FECHA_CONSULTA);
const DESTINO = resolve(RAIZ, "src/data/catalogo");
const URL_LISTADO = "https://portalciudadano.merida.gob.mx/TramitesEnLinea/tramites";

// --- Formas de las instantáneas -------------------------------------------------------------------

interface Iniciar {
  href?: string | null;
  tramite_ed?: boolean;
  dominio?: string | null;
  prefijo?: string | null;
  id_tramite?: string | null;
}

interface FichaIndice {
  nombre: string;
  unidad_data: string;
  categorias: string[];
  grupos: string[];
  clave: string;
  unidad: string;
  descripcion: string | null;
  modalidad: string;
  detalle: string;
  iniciar: Iniciar | null;
}

interface RequisitoDetalle {
  codigo?: string;
  nombre: string;
  obligatorio: number | null;
  presentacion?: string[];
  aplicaA?: string[];
  documentosAceptados?: string[];
}

interface ProcedimientoDetalle {
  tipo: string;
  clave: "EN_LINEA" | "MODULOS" | "TELEFONICO" | string;
  enlace: string | null;
  pasos: string[];
}

interface FichaDetalle {
  url: string;
  clave: string;
  nombreLegal: string;
  nombreCiudadano: string | null;
  unidad: string;
  departamento: string | null;
  modalidad: string;
  descripcion: string | null;
  porQue: string | null;
  resolutivo: string | null;
  vigenciaResolutivo: string | null;
  categorias: string[];
  fechaActualizacion: string | null;
  tiempoRespuesta: string | null;
  tipoCosto: string | null;
  costoTexto: string | null;
  cuandoPagar: string | null;
  dondePagar: string[];
  formasPago: string[];
  enlaceSitio: string | null;
  requisitos: RequisitoDetalle[];
  procedimientos: ProcedimientoDetalle[];
  modulos: string[];
  observaciones: string | null;
  criterio: string | null;
}

// --- Utilidades ------------------------------------------------------------------------------------

function leerJson<T>(archivo: string): T {
  return JSON.parse(readFileSync(resolve(ORIGEN, archivo), "utf8")) as T;
}

/** Limpia guiones suaves y espacios de la fuente sin alterar el texto. */
function limpiar(texto: string | null | undefined): string {
  return (texto ?? "").replace(/­/g, "").replace(/\s+/g, " ").trim();
}

function sinAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function fechaIso(fecha: string | null | undefined): string | undefined {
  const coincidencia = /^(\d{4}-\d{2}-\d{2})/.exec(fecha ?? "");
  return coincidencia?.[1];
}

const MODALIDADES_EN_LINEA = new Set(["100% en línea", "Gestión en línea", "Presolicitud en línea"]);

/** Fichas sensibles: nunca se simulan citas ni solicitudes que se guarden. */
const FICHAS_SENSIBLES: Record<string, string> = {
  "MID-BIH-007": "/bienestar/salud-mental",
  "MID-BIH-016": "/bienestar/salud-mental",
  "MID-INMU-370": "/bienestar/linea-mujer",
  "MID-INMU-397": "/bienestar/linea-mujer",
  "MID-INMU-399": "/bienestar/linea-mujer",
  "MID-DIF-179": "/bienestar/linea-mujer",
};

/** Servicios de reporte con categoría equivalente en Mérida Móvil (ruta al formulario interno). */
const REPORTE_POR_CLAVE: Record<string, string> = {
  "MID-OBP-275": "bache",
  "MID-SEP-334": "luminaria",
  "MID-SEP-330": "desazolve_rejilla",
  "MID-SEP-345": "basura_via_publica",
  "MID-SEP-333": "animal_muerto",
  "MID-SEP-335": "parques_jardines",
};

/** Escenarios ficticios de src/data/recorridos-demo.ts. */
const ESCENARIO_POR_CLAVE: Record<string, string> = {
  "MID-FTM-201": "pago-predial-demo",
  "MID-FTM-206": "apertura-negocio-demo",
  "MID-PBE-296": "apertura-negocio-demo",
  "MID-FTM-189": "apertura-negocio-demo",
};

const ESCENARIO_POR_TIPO: Partial<Record<TipoRecorrido, string>> = {
  formulario: "solicitud-en-linea-demo",
  cita: "cita-presencial-demo",
  pago: "pago-referencia-demo",
};

// --- Categorías ------------------------------------------------------------------------------------

interface ReglaCategoria {
  portal: string;
  categoria: (ficha: FichaIndice, esReporte: boolean) => CategoriaId | null;
}

const fija =
  (categoria: CategoriaId) =>
  (): CategoriaId =>
    categoria;

const REGLAS_CATEGORIA: ReglaCategoria[] = [
  { portal: "servicios públicos", categoria: (_f, esReporte) => (esReporte ? "reportes" : null) },
  { portal: "impuestos y contribuciones", categoria: fija("pagos") },
  { portal: "apertura de negocios", categoria: fija("negocios") },
  { portal: "laboral", categoria: fija("empleo") },
  { portal: "eventos culturales", categoria: fija("cultura") },
  { portal: "deporte", categoria: fija("deporte") },
  { portal: "seguridad, legalidad y justicia", categoria: fija("seguridad") },
  { portal: "educación", categoria: fija("educacion") },
  { portal: "salud", categoria: fija("bienestar") },
  { portal: "asistencia social", categoria: fija("bienestar") },
  { portal: "protección sanitaria", categoria: fija("bienestar") },
  { portal: "economía", categoria: fija("negocios") },
  { portal: "medio ambiente", categoria: fija("medio_ambiente") },
  { portal: "servicio de sanidad animal", categoria: fija("medio_ambiente") },
  { portal: "identidad", categoria: (f) => (f.unidad === "Identidad y Cultura" ? "cultura" : "atencion_ciudadana") },
  { portal: "territorio y vivienda", categoria: fija("territorio") },
  { portal: "construcción", categoria: fija("territorio") },
  { portal: "turismo", categoria: fija("turismo") },
  { portal: "transparencia", categoria: fija("regulaciones") },
  { portal: "atención ciudadana", categoria: fija("atencion_ciudadana") },
  { portal: "asistencia jurídica", categoria: fija("atencion_ciudadana") },
  { portal: "servicios públicos", categoria: (_f, esReporte) => (esReporte ? null : "atencion_ciudadana") },
];

function categoriasDe(ficha: FichaIndice, esReporte: boolean): { principal: CategoriaId; secundarias: CategoriaId[] } {
  const portal = new Set(ficha.categorias.map((c) => c.toLowerCase()));
  const ordenadas: CategoriaId[] = [];
  for (const regla of REGLAS_CATEGORIA) {
    if (!portal.has(regla.portal)) continue;
    const categoria = regla.categoria(ficha, esReporte);
    if (categoria && !ordenadas.includes(categoria)) ordenadas.push(categoria);
  }
  let principal: CategoriaId = ordenadas[0] ?? "atencion_ciudadana";
  if (portal.size >= 8) principal = "atencion_ciudadana";
  if (/funcionamiento|apertura r[aá]pida de empresas|estacionamiento p[uú]blico/i.test(ficha.nombre)) principal = "negocios";
  if (FICHAS_SENSIBLES[ficha.clave]) principal = "bienestar";
  return { principal, secundarias: ordenadas.filter((c) => c !== principal) };
}

// --- Tipo de recorrido -----------------------------------------------------------------------------

function tipoDeRecorrido(ficha: FichaIndice, detalle: FichaDetalle | undefined, principal: CategoriaId): TipoRecorrido {
  const nombre = ficha.nombre;
  const texto = `${nombre} ${ficha.descripcion ?? ""}`;
  if (FICHAS_SENSIBLES[ficha.clave]) return "informativo";
  if (/^pago\b/i.test(nombre.trim())) return "pago";
  if (esReporte(ficha)) return "reporte";
  const pasos = (detalle?.procedimientos ?? []).flatMap((p) => p.pasos).join(" ");
  const presencial = ficha.modalidad === "100% Presencial";
  if (
    /\bcita\b|agend/i.test(`${texto} ${pasos}`) ||
    (presencial && /visitas? guiadas?|consulta (de|del|m[eé]dica)|atenci[oó]n (m[eé]dica|odontol)|rehabilitaci[oó]n/i.test(texto))
  ) {
    return "cita";
  }
  if (principal === "regulaciones") return "consulta_documental";
  if (ficha.unidad === "Catastro" || ficha.unidad === "Desarrollo Urbano") return "consulta_territorial";
  if (MODALIDADES_EN_LINEA.has(ficha.modalidad)) return "formulario";
  return "informativo";
}

function esReporte(ficha: FichaIndice): boolean {
  if (/visitas? guiadas?|paseo/i.test(ficha.nombre)) return false;
  if (/\breportes?\b/i.test(ficha.nombre)) return true;
  const serviciosPublicos = ficha.categorias.some((c) => c.toLowerCase() === "servicios públicos");
  const unidadOperativa = ficha.unidad === "Servicios Públicos" || ficha.unidad === "Obras Públicas";
  return serviciosPublicos && unidadOperativa && ficha.modalidad === "100% en línea";
}

// --- Detalle: requisitos, pasos, costo, tiempos, canales ----------------------------------------------

function requisitosDe(detalle: FichaDetalle): Requisito[] {
  return detalle.requisitos.map((r) => {
    const aplicaA = (r.aplicaA ?? []).map(limpiar).filter(Boolean);
    const documentos = (r.documentosAceptados ?? []).map(limpiar).filter(Boolean);
    const presentacion = (r.presentacion ?? []).map(limpiar).filter(Boolean);
    const requisito: Requisito = {
      nombre: limpiar(r.nombre),
      obligatorio: r.obligatorio === 1 ? true : r.obligatorio === 0 ? false : null,
    };
    if (aplicaA.length > 0) requisito.descripcion = `Aplica a: ${aplicaA.join(", ")}.`;
    if (documentos.length > 0) requisito.documentosAceptados = documentos;
    if (presentacion.length > 0) requisito.presentacion = presentacion.join(", ");
    return requisito;
  });
}

const CANAL_PROCEDIMIENTO: Record<string, PasoServicio["canal"]> = {
  EN_LINEA: "en_linea",
  MODULOS: "presencial",
  TELEFONICO: "telefonico",
};

const NOMBRE_PROCEDIMIENTO: Record<string, string> = {
  EN_LINEA: "En línea",
  MODULOS: "Presencial",
  TELEFONICO: "Por teléfono",
};

function pasosDe(detalle: FichaDetalle): PasoServicio[] {
  const pasos: PasoServicio[] = [];
  for (const procedimiento of detalle.procedimientos) {
    for (const paso of procedimiento.pasos) {
      const titulo = limpiar(paso);
      if (!titulo) continue;
      const canal = CANAL_PROCEDIMIENTO[procedimiento.clave];
      pasos.push({
        orden: pasos.length + 1,
        titulo,
        descripcion: NOMBRE_PROCEDIMIENTO[procedimiento.clave] ?? limpiar(procedimiento.tipo),
        ...(canal ? { canal } : {}),
      });
    }
  }
  return pasos;
}

function costoDe(detalle: FichaDetalle): CostoServicio {
  const texto = limpiar(detalle.costoTexto);
  const tipo = detalle.tipoCosto === "gratuito" || detalle.tipoCosto === "fijo" || detalle.tipoCosto === "variable" ? detalle.tipoCosto : "pendiente";
  return texto ? { tipo, texto } : { tipo };
}

function tiempoDe(detalle: FichaDetalle): string | undefined {
  const [modo, cantidad, dias] = (detalle.tiempoRespuesta ?? "").split("|");
  if (modo === "inmediato") return "Inmediato";
  if (modo === "especifico" && cantidad && cantidad !== "None") {
    const n = Number(cantidad);
    const unidad = n === 1 ? "día" : "días";
    const tipoDias = dias === "habiles" ? (n === 1 ? " hábil" : " hábiles") : dias === "naturales" ? (n === 1 ? " natural" : " naturales") : "";
    return `${cantidad} ${unidad}${tipoDias}`;
  }
  return undefined;
}

/** Teléfonos que aparecen literalmente en la descripción de la ficha (p. ej. Ayuntatel). */
function telefonosLiterales(detalle: FichaDetalle): CanalAtencion[] {
  if (detalle.clave !== "MID-PAC-315") return [];
  const descripcion = limpiar(detalle.descripcion);
  const canales: CanalAtencion[] = [];
  if (descripcion.includes("999924-4000")) {
    canales.push({ tipo: "telefono", etiqueta: "Ayuntatel", valor: "999 924 4000", verificado: true, fuente: detalle.url });
  }
  if (descripcion.includes("070")) {
    canales.push({ tipo: "telefono", etiqueta: "Ayuntatel desde celular", valor: "070", verificado: true, fuente: detalle.url });
  }
  return canales;
}

function canalesDetalle(detalle: FichaDetalle): CanalAtencion[] {
  const canales: CanalAtencion[] = [];
  const enlaces = new Set<string>();
  for (const procedimiento of detalle.procedimientos) {
    if (procedimiento.clave === "EN_LINEA" && procedimiento.enlace) enlaces.add(procedimiento.enlace);
  }
  if (detalle.enlaceSitio) enlaces.add(detalle.enlaceSitio);
  for (const enlace of enlaces) {
    canales.push({ tipo: "en_linea", etiqueta: "Sitio oficial del trámite", valor: enlace, verificado: true, fuente: detalle.url });
  }
  canales.push(...telefonosLiterales(detalle));
  for (const modulo of detalle.modulos) {
    const nombre = limpiar(modulo);
    if (!nombre) continue;
    canales.push({ tipo: "presencial", etiqueta: "Módulo de atención", valor: nombre, verificado: true, fuente: detalle.url });
  }
  return canales;
}

function canalesIndice(ficha: FichaIndice): CanalAtencion[] {
  const iniciar = ficha.iniciar;
  if (!iniciar) return [];
  if (iniciar.tramite_ed) {
    return [
      {
        tipo: "en_linea",
        etiqueta: "Botón «Iniciar» del Portal Ciudadano (con Expediente Digital)",
        valor: ficha.detalle,
        verificado: false,
        fuente: URL_LISTADO,
      },
    ];
  }
  if (iniciar.href && iniciar.href !== "#") {
    return [{ tipo: "en_linea", etiqueta: "Enlace «Iniciar» publicado en el listado", valor: iniciar.href, verificado: false, fuente: URL_LISTADO }];
  }
  return [];
}

// --- Palabras clave --------------------------------------------------------------------------------

const PALABRAS_POR_TEMA: { patron: RegExp; palabras: string[] }[] = [
  { patron: /bacheo|pavimenta/i, palabras: ["bache", "hoyo en la calle", "pavimento"] },
  { patron: /alumbrado/i, palabras: ["luminaria", "foco", "lámpara", "poste sin luz"] },
  { patron: /rejilla|desazolve|desag[uü]e|pozo colector/i, palabras: ["coladera", "encharcamiento", "inundación", "desazolve de rejilla"] },
  { patron: /basura|residuos|limpieza de calles/i, palabras: ["basura", "cacharros", "recolección"] },
  { patron: /animal|antirr[aá]bica|mascota|veterinari/i, palabras: ["mascota", "perro", "gato"] },
  { patron: /psicol/i, palabras: ["psicólogo", "salud mental", "terapia", "apoyo psicológico", "ansiedad"] },
  { patron: /m[eé]dic|salud|enfermer|odontol|nutrici/i, palabras: ["doctor", "consulta médica", "salud"] },
  { patron: /bolsa de trabajo|empleo/i, palabras: ["chamba", "trabajo", "vacantes", "empleo"] },
  { patron: /emprend|cr[eé]dito|comercio justo/i, palabras: ["negocio", "emprender", "emprendedores"] },
  { patron: /funcionamiento|apertura|uso del? suelo/i, palabras: ["negocio", "abrir un negocio", "local", "licencia"] },
  { patron: /predial/i, palabras: ["predial", "impuesto de mi casa", "pagar predial"] },
  { patron: /museo|cultur|art[ií]stic|danza|m[uú]sica|literari|planetario|biblioteca/i, palabras: ["cultura", "actividades culturales", "talleres", "eventos"] },
  { patron: /deport|nataci[oó]n|box|entrenamiento|acu[aá]tico/i, palabras: ["deporte", "ejercicio", "entrenar"] },
  { patron: /beca|propedéutico|propedeutico|ingl[eé]s|acad[eé]mic/i, palabras: ["escuela", "estudiar", "beca", "educación"] },
  { patron: /[aá]rbol|poda|ramas/i, palabras: ["árbol", "poda", "ramas"] },
  { patron: /mujer|violencia/i, palabras: ["mujeres", "violencia", "Línea Mujer"] },
  { patron: /transparencia|informaci[oó]n p[uú]blica|datos personales/i, palabras: ["transparencia", "solicitud de información"] },
  { patron: /catastr|c[eé]dula/i, palabras: ["catastro", "predio", "cédula catastral"] },
  { patron: /construcci[oó]n|obra/i, palabras: ["construir", "obra", "permiso de construcción"] },
  { patron: /ayuntatel/i, palabras: ["Ayuntatel", "070", "reporte por teléfono"] },
  { patron: /parque|[aá]reas verdes|jard/i, palabras: ["parque", "jardín", "áreas verdes"] },
];

const GRUPOS_GENERICOS = new Set(["mujeres", "hombres"]);

function palabrasClaveDe(ficha: FichaIndice, detalle: FichaDetalle | undefined): string[] {
  const palabras = new Set<string>();
  const texto = `${ficha.nombre} ${ficha.descripcion ?? ""}`;
  for (const { patron, palabras: lista } of PALABRAS_POR_TEMA) if (patron.test(texto)) for (const p of lista) palabras.add(p);
  for (const grupo of ficha.grupos) if (!GRUPOS_GENERICOS.has(grupo)) palabras.add(grupo);
  for (const categoria of ficha.categorias) palabras.add(categoria);
  const ciudadano = limpiar(detalle?.nombreCiudadano);
  if (ciudadano && sinAcentos(ciudadano) !== sinAcentos(ficha.nombre)) palabras.add(ciudadano);
  palabras.add(ficha.clave);
  return [...palabras];
}

// --- Ensamblado ------------------------------------------------------------------------------------

function rutaInterna(ficha: FichaIndice, id: string, tipo: TipoRecorrido): string {
  const sensible = FICHAS_SENSIBLES[ficha.clave];
  if (sensible) return sensible;
  if (tipo === "reporte") {
    const categoria = REPORTE_POR_CLAVE[ficha.clave];
    return categoria ? `/reportes/nuevo/${categoria}` : "/reportes";
  }
  if (tipo === "formulario" || tipo === "cita" || tipo === "pago") return `/servicios/${id}/iniciar`;
  return `/servicios/${id}`;
}

function construirServicio(ficha: FichaIndice, detalle: FichaDetalle | undefined): Servicio {
  const id = ficha.clave.toLowerCase();
  const reporte = esReporte(ficha) && !FICHAS_SENSIBLES[ficha.clave];
  const { principal, secundarias } = categoriasDe(ficha, reporte);
  const tipo = tipoDeRecorrido(ficha, detalle, principal);
  const actualizacion = fechaIso(detalle?.fechaActualizacion);
  const escenario = ESCENARIO_POR_CLAVE[ficha.clave] ?? ESCENARIO_POR_TIPO[tipo];
  const nombreCiudadano = limpiar(detalle?.nombreCiudadano);
  const dependencia = detalle?.departamento ? `${limpiar(ficha.unidad)} · ${limpiar(detalle.departamento)}` : limpiar(ficha.unidad);

  const servicio: Servicio = {
    id,
    clave: ficha.clave,
    nombre: limpiar(ficha.nombre),
    ...(nombreCiudadano && sinAcentos(nombreCiudadano) !== sinAcentos(ficha.nombre) ? { nombreCiudadano } : {}),
    categoria: principal,
    ...(secundarias.length > 0 ? { categoriasSecundarias: secundarias } : {}),
    descripcion: limpiar(ficha.descripcion) || "La ficha del listado no publica descripción.",
    dependencia,
    modalidadOficial: ficha.modalidad,
    sistemaDeOrigen: "Portal Ciudadano (MIDigital)",
    fuenteOficial: {
      nombre: `Portal Ciudadano · Ficha ${ficha.clave}`,
      url: ficha.detalle,
      fechaConsulta: FECHA_CONSULTA,
      ...(actualizacion ? { fechaActualizacionFuente: actualizacion } : {}),
    },
    fechaDeVerificacion: FECHA_CONSULTA,
    estadoDeInformacion: detalle ? "verificada" : "pendiente",
    estadoDeIntegracion: "simulada",
    rutaInterna: rutaInterna(ficha, id, tipo),
    tipoDeRecorrido: tipo,
    requisitos: detalle ? requisitosDe(detalle) : null,
    pasos: detalle ? pasosDe(detalle) : null,
    canalesDeAtencion: detalle ? canalesDetalle(detalle) : canalesIndice(ficha),
    costo: detalle ? costoDe(detalle) : { tipo: "pendiente" },
    palabrasClave: palabrasClaveDe(ficha, detalle),
  };
  const tiempo = detalle ? tiempoDe(detalle) : undefined;
  if (tiempo) servicio.tiempoDeRespuesta = tiempo;
  if (escenario) servicio.recorridoDemoId = escenario;
  const notas: string[] = [];
  if (detalle?.criterio) notas.push(`Criterio publicado: ${limpiar(detalle.criterio)}`);
  if (detalle?.observaciones) notas.push(`Observaciones publicadas: ${limpiar(detalle.observaciones)}`);
  if (!detalle) notas.push("Ficha tomada del listado: requisitos, costo y tiempos pendientes de verificar en la ficha oficial.");
  if (notas.length > 0) servicio.notas = notas.join(" ");
  return servicio;
}

function principal(): void {
  const indice = leerJson<FichaIndice[]>("indice-tramites.json");
  const detalles = new Map(leerJson<FichaDetalle[]>("fichas-detalle.json").map((d) => [d.clave, d]));

  const servicios = indice.map((ficha) => construirServicio(ficha, detalles.get(ficha.clave)));
  const ids = new Set<string>();
  for (const servicio of servicios) {
    if (ids.has(servicio.id)) throw new Error(`Clave duplicada en el listado: ${servicio.id}`);
    ids.add(servicio.id);
  }

  const cobertura: CoberturaCatalogo = {
    totalFuente: indice.length,
    totalImportado: servicios.length,
    verificados: servicios.filter((s) => s.estadoDeInformacion === "verificada").length,
    pendientes: servicios.filter((s) => s.estadoDeInformacion === "pendiente").length,
    demostracion: servicios.filter((s) => s.estadoDeInformacion === "demostracion").length,
    fuente: { nombre: "Portal Ciudadano (MIDigital) · Trámites y Servicios", url: URL_LISTADO, fechaConsulta: FECHA_CONSULTA },
  };

  mkdirSync(DESTINO, { recursive: true });
  writeFileSync(resolve(DESTINO, "servicios.generated.json"), `${JSON.stringify(servicios, null, 2)}\n`, "utf8");
  writeFileSync(resolve(DESTINO, "cobertura.generated.json"), `${JSON.stringify(cobertura, null, 2)}\n`, "utf8");

  const porCategoria = new Map<string, number>();
  const porTipo = new Map<string, number>();
  for (const s of servicios) {
    porCategoria.set(s.categoria, (porCategoria.get(s.categoria) ?? 0) + 1);
    porTipo.set(s.tipoDeRecorrido, (porTipo.get(s.tipoDeRecorrido) ?? 0) + 1);
  }
  process.stdout.write(
    [
      `Catálogo importado: ${servicios.length} servicios (${cobertura.verificados} verificados, ${cobertura.pendientes} pendientes).`,
      `Por categoría: ${[...porCategoria].map(([k, v]) => `${k}=${v}`).join(", ")}`,
      `Por recorrido: ${[...porTipo].map(([k, v]) => `${k}=${v}`).join(", ")}`,
      "",
    ].join("\n"),
  );
}

principal();
