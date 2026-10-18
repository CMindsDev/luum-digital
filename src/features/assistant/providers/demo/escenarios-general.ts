/**
 * Escenarios programados del asistente general (ámbito "general"). Reglas locales y reproducibles:
 * no hay modelo de IA. Cubren las consultas de ejemplo del brief:
 * «Quiero reportar un bache», «Necesito saber qué documentos pide este trámite», «Quiero consultar
 * mi folio», «Busco apoyo psicológico», «Quiero revisar un trámite de mi negocio» y «Busco
 * actividades culturales»; además mapa, beneficios, señalar y navegar.
 * Ante señales de riesgo, lo primero es mostrar ayuda humana.
 */
import { t } from "i18next";
import { z } from "zod";
import type { ReciboAccion, Seccion } from "@shared/asistente/acciones";
import { msg } from "@/i18n";
import type { CategoriaReporte } from "@/types";
import { fuentesDeRecibo, NOMBRES_REPORTE } from "../../runtime/ejecutor";
import type { Escenarios, HerramientasEscenario } from "./sesion-demo";
import { capitalizar, contiene, detectarRiesgo, esAfirmacion, esNegacion, normalizar } from "./texto";

const ETIQUETA_INFORMACION: Record<"verificada" | "pendiente" | "demostracion", string> = {
  verificada: msg("información verificada"),
  pendiente: msg("pendiente de verificar"),
  demostracion: msg("información de ejemplo"),
};

const ResultadosSchema = z.object({
  resultados: z.array(
    z.object({ id: z.string(), nombre: z.string(), estadoDeInformacion: z.enum(["verificada", "pendiente", "demostracion"]) }),
  ),
});

const RequisitosSchema = z.object({
  servicio: z.object({ nombre: z.string() }),
  requisitos: z.union([z.literal("pendiente de verificar"), z.array(z.object({ nombre: z.string(), obligatorio: z.boolean().nullable() }))]),
  costo: z.string(),
  tiempoDeRespuesta: z.string().optional(),
});

const ReporteSchema = z.object({
  reporte: z.object({ folio: z.string(), tipo: z.string(), estadoMunicipal: z.string() }),
});

const GestionSchema = z.object({
  gestion: z.object({ folio: z.string(), servicio: z.string(), estado: z.string() }),
});

const ResumenGestionesSchema = z.object({
  total: z.number(),
  recientes: z.array(z.object({ folio: z.string(), servicio: z.string(), estado: z.string() })),
});

const SaldoSchema = z.object({
  saldo: z.object({ disponible: z.number(), pendientes: z.number() }),
  beneficios: z.array(z.object({ nombre: z.string(), costoPuntos: z.number() })),
});

const SUGERENCIAS = msg(
  "Prueba con: «Quiero reportar un bache», «¿Qué documentos pide este trámite?», «Quiero consultar mi folio», «Busco apoyo psicológico», «Quiero revisar un trámite de mi negocio» o «Busco actividades culturales».",
);

const PALABRAS_REPORTE: readonly (readonly [CategoriaReporte, readonly string[]])[] = [
  ["bache", ["bache", "hoyo en la calle", "hoyo en el pavimento", "socavon", "hundimiento"]],
  ["luminaria", ["luminaria", "lampara", "alumbrado", "poste de luz", "foco de la calle", "foco fundido", "luz de la calle", "no prende la luz"]],
  ["desazolve_rejilla", ["rejilla", "alcantarilla", "coladera", "desazolve", "encharca", "inunda"]],
  ["animal_muerto", ["animal muerto", "perro muerto", "gato muerto", "animal sin vida"]],
  ["recoleccion_basura", ["no paso la basura", "no paso el camion", "camion de la basura", "recoleccion"]],
  ["basura_via_publica", ["basura en la calle", "basura tirada", "tiradero", "basura en via publica", "escombro"]],
  ["parques_jardines", ["parque", "jardin", "arbol caido", "poda", "pasto crecido"]],
];

const VERBOS_REPORTE = ["reportar", "reporte", "reporto", "reporta", "hay un", "hay una", "hay mucha", "fundid", "no sirve", "no prende", "se fundio", "tapad", "levantar"];

/** Palabras que ya describen un problema por sí solas («bache en la 60»). */
const CATEGORIAS_PROBLEMA: readonly CategoriaReporte[] = ["bache", "animal_muerto", "basura_via_publica", "desazolve_rejilla"];

const SECCIONES_TEXTO: readonly (readonly [Seccion, readonly string[]])[] = [
  ["mis_reportes", ["mis reportes"]],
  ["salud_mental", ["salud mental"]],
  ["linea_mujer", ["linea mujer"]],
  ["gestiones", ["mis gestiones", "gestiones", "mis tramites"]],
  ["expediente", ["expediente", "mis documentos"]],
  ["notificaciones", ["notificaciones", "avisos"]],
  ["participacion", ["participacion", "recompensas"]],
  ["cuenta", ["cuenta", "identidad", "configuracion"]],
  ["bienestar", ["bienestar"]],
  ["mapa", ["mapa", "visor urbano"]],
  ["servicios", ["servicios", "tramites", "catalogo"]],
  ["reportes", ["reportes"]],
  ["inicio", ["inicio", "pagina principal", "portada"]],
];

function categoriaReporte(normalizado: string): CategoriaReporte | null {
  return PALABRAS_REPORTE.find(([, palabras]) => contiene(normalizado, palabras))?.[0] ?? null;
}

function seccionMencionada(normalizado: string): Seccion | null {
  return SECCIONES_TEXTO.find(([, palabras]) => contiene(normalizado, palabras))?.[0] ?? null;
}

/** Referencia de ubicación escrita por la persona («en la calle 60 del Centro»). */
function referenciaUbicacion(texto: string): string | undefined {
  const coincidencia =
    /\b(?:en|sobre|frente a|cerca de|por|esquina con)\s+(?:la\s+|el\s+)?((?:calle|av\.?|avenida|perif[eé]rico|carretera|colonia|col\.|fraccionamiento|fracc\.|cruzamiento)\b[^.,;!?\n]{1,120})/i.exec(
      texto,
    );
  const referencia = coincidencia?.[1]?.trim();
  return referencia ? referencia.slice(0, 160) : undefined;
}

/** Descripción sugerida a partir de lo que escribió la persona (ella la revisa antes de enviar). */
function descripcionSugerida(texto: string, categoria: CategoriaReporte, referencia: string | undefined): string {
  const limpio = texto
    .trim()
    .replace(/^(hola[,!.\s]*)?/i, "")
    .replace(/^(quiero|quisiera|necesito|me gustaria|puedes|podr[ií]as|ay[uú]dame a)?\s*(reportar|hacer un reporte de|levantar un reporte de|reporta|reportarte)\s*/i, "")
    .trim();
  const propia = capitalizar(limpio).replace(/[.!\s]*$/, ".");
  if (Array.from(propia).length >= 15) return propia.slice(0, 300);
  const base = NOMBRES_REPORTE[categoria] === "Bache a la vista" ? "Bache" : NOMBRES_REPORTE[categoria];
  return `${base} en ${referencia ?? "la vía pública"}.`.slice(0, 300);
}

function folioEscrito(texto: string): string | null {
  const coincidencia = /\bDEMO\s*[-‐–]?\s*([RGPCB])\s*[-‐–]?\s*([A-Z0-9]{1,20})\b/i.exec(texto);
  return coincidencia ? `DEMO-${coincidencia[1]?.toUpperCase()}-${coincidencia[2]?.toUpperCase()}` : null;
}

/** Tema de «requisitos para X» o «qué documentos pide X». Null si no lo dice («este trámite»). */
function temaDeRequisitos(normalizado: string): string | null {
  const coincidencia = /(?:requisitos?|documentos|papeles|que necesito|que se necesita|que piden|que pide)\s+(?:de|para|del|de la|pide|piden)?\s*(?:el|la|los|las|un|una|sacar|tramitar|hacer)?\s*(.+)$/.exec(normalizado);
  const tema = coincidencia?.[1]?.trim() ?? "";
  if (!tema || /^(este|ese|esta|esa|un|el) (tramite|servicio)$/.test(tema) || /^(este|ese|esta|esa|pide|piden)/.test(tema)) return null;
  return tema.length >= 3 ? tema.slice(0, 120) : null;
}

function servicioEnPantalla(herramientas: HerramientasEscenario): string | null {
  const coincidencia = /^\/servicios\/([^/]+)$/.exec(herramientas.pantalla.ruta);
  const id = coincidencia?.[1];
  return id && id !== "categoria" ? decodeURIComponent(id) : null;
}

// --- Respuestas a partir de los recibos ---

function falla(herramientas: HerramientasEscenario, recibo: ReciboAccion, prefijo = msg("No pude completarlo")) {
  herramientas.decir(t("{{prefijo}}: {{mensaje}}", { prefijo: t(prefijo), mensaje: t(recibo.mensaje) }));
}

async function buscarYProponer(herramientas: HerramientasEscenario, consulta: string, cierre?: string) {
  const recibo = await herramientas.accion("buscarServicios", { consulta });
  if (recibo.estado === "fallida") return falla(herramientas, recibo, msg("No pude buscar en el catálogo"));
  const datos = ResultadosSchema.safeParse(recibo.datos);
  const resultados = datos.success ? datos.data.resultados : [];
  if (resultados.length === 0) {
    herramientas.decir(t("No encontré servicios para «{{consulta}}» en el catálogo de servicios. Prueba con otras palabras o explora «Trámites y servicios».", { consulta }));
    return;
  }
  const lista = resultados.map((resultado, indice) => `${indice + 1}. ${resultado.nombre} (${t(ETIQUETA_INFORMACION[resultado.estadoDeInformacion])})`).join("\n");
  const primero = resultados[0];
  if (primero) herramientas.memoria.propuesta = { tipo: "requisitos", servicioId: primero.id, nombre: primero.nombre };
  herramientas.decir(
    [
      t("Encontré esto en el catálogo de servicios y lo dejé en pantalla:\n{{lista}}", { lista }),
      primero ? t("¿Quieres que te muestre los requisitos de «{{nombre}}»?", { nombre: primero.nombre }) : "",
      cierre ?? "",
    ]
      .filter(Boolean)
      .join("\n\n"),
    fuentesDeRecibo(recibo),
  );
}

async function mostrarRequisitos(herramientas: HerramientasEscenario, servicioId: string) {
  const recibo = await herramientas.accion("consultarRequisitos", { servicioId });
  if (recibo.estado === "fallida") return falla(herramientas, recibo, msg("No pude abrir los requisitos"));
  const datos = RequisitosSchema.safeParse(recibo.datos);
  if (!datos.success) {
    herramientas.decir(t(recibo.mensaje), fuentesDeRecibo(recibo));
    return;
  }
  const { servicio, requisitos, costo, tiempoDeRespuesta } = datos.data;
  if (requisitos === "pendiente de verificar") {
    herramientas.decir(
      t(
        "Abrí la ficha de «{{servicio}}». Sus requisitos están pendientes de verificar, así que no te los voy a inventar: confírmalos en la fuente oficial que aparece en la ficha.",
        { servicio: servicio.nombre },
      ),
      fuentesDeRecibo(recibo),
    );
    return;
  }
  const lista = requisitos.length
    ? requisitos.map((requisito) => `• ${requisito.nombre}${requisito.obligatorio === false ? t(" (si aplica)") : ""}`).join("\n")
    : t("• La fuente no publica requisitos.");
  herramientas.decir(
    [
      t("Estos son los requisitos de «{{servicio}}», tal como los publica la fuente oficial:\n{{lista}}", { servicio: servicio.nombre, lista }),
      t("Costo: {{costo}}.{{tiempo}}", {
        costo,
        tiempo: tiempoDeRespuesta ? t(" Tiempo de respuesta: {{tiempo}}.", { tiempo: tiempoDeRespuesta }) : "",
      }),
      t("Te dejé la ficha abierta en la sección de requisitos."),
    ].join("\n\n"),
    fuentesDeRecibo(recibo),
  );
}

async function prepararReporte(herramientas: HerramientasEscenario, texto: string, categoria: CategoriaReporte) {
  const referencia = referenciaUbicacion(texto);
  const recibo = await herramientas.accion("prepararReporte", {
    categoria,
    descripcion: descripcionSugerida(texto, categoria, referencia),
    ...(referencia ? { referenciaUbicacion: referencia } : {}),
  });
  if (recibo.estado === "fallida") return falla(herramientas, recibo, msg("No pude abrir el formulario"));
  herramientas.decir(
    t(
      "Listo: abrí «{{categoria}}» con una descripción sugerida. Revísala, confirma la ubicación (en el mapa o escrita) y envíalo tú cuando esté bien. No se envía nada hasta que confirmes.",
      { categoria: t(NOMBRES_REPORTE[categoria]) },
    ),
  );
}

/** Sin folio se abre «Mis reportes» y se explica cómo consultar uno. Nunca se inventa un folio. */
async function consultarFolio(herramientas: HerramientasEscenario, folio: string | null) {
  const recibo = await herramientas.accion("consultarReporte", folio ? { folio } : {});
  if (recibo.estado === "fallida") {
    herramientas.decir(t(recibo.mensaje));
    return;
  }
  const reporte = ReporteSchema.safeParse(recibo.datos);
  if (reporte.success) {
    const { folio: encontrado, tipo, estadoMunicipal } = reporte.data.reporte;
    herramientas.decir(t("El reporte {{folio}} («{{tipo}}») está «{{estado}}». Te abrí su detalle con el historial.", { folio: encontrado, tipo: t(tipo), estado: t(estadoMunicipal) }));
    return;
  }
  const gestion = GestionSchema.safeParse(recibo.datos);
  if (gestion.success) {
    const { folio: encontrado, servicio, estado } = gestion.data.gestion;
    herramientas.decir(t("La gestión {{folio}} («{{servicio}}») está «{{estado}}». Te abrí su detalle.", { folio: encontrado, servicio, estado: t(estado) }));
    return;
  }
  herramientas.decir(
    t("{{mensaje}} Si tienes un folio, escríbelo tal cual (empieza con DEMO-R- para reportes o DEMO-G- para gestiones).", {
      mensaje: t(recibo.mensaje),
    }),
  );
}

async function consultarGestiones(herramientas: HerramientasEscenario) {
  const recibo = await herramientas.accion("consultarGestionesDemo", {});
  if (recibo.estado === "fallida") return falla(herramientas, recibo, msg("No pude abrir tus gestiones"));
  const datos = ResumenGestionesSchema.safeParse(recibo.datos);
  if (!datos.success || datos.data.total === 0) {
    herramientas.decir(t(recibo.mensaje));
    return;
  }
  const lista = datos.data.recientes.map((gestion) => `• ${gestion.folio} — ${gestion.servicio}: ${gestion.estado}`).join("\n");
  herramientas.decir(
    t("{{mensaje}}\n{{lista}}\n\nRevísalas con calma antes de continuar: no sustituyen un trámite oficial.", {
      mensaje: t(recibo.mensaje),
      lista,
    }),
  );
}

async function apoyoPsicologico(herramientas: HerramientasEscenario) {
  await herramientas.accion("mostrarApoyoHumano", { motivo: "salud_mental" });
  const recibo = await herramientas.accion("navegar", { seccion: "salud_mental" });
  herramientas.decir(
    recibo.estado === "fallida"
      ? t("Te mostré los canales de ayuda humana verificados. También puedes abrir «Bienestar» → «Salud mental» desde el menú.")
      : t("Te llevé a «Salud mental». Ahí están los canales de ayuda humana verificados. Si estás en peligro ahora, usa «Ayuda inmediata»."),
  );
}

async function beneficios(herramientas: HerramientasEscenario) {
  const recibo = await herramientas.accion("explicarBeneficiosDemo", {});
  if (recibo.estado === "fallida") return falla(herramientas, recibo, msg("No pude abrir tus recompensas"));
  const datos = SaldoSchema.safeParse(recibo.datos);
  if (!datos.success) {
    herramientas.decir(t(recibo.mensaje));
    return;
  }
  const { saldo, beneficios: lista } = datos.data;
  const ejemplos = lista.length
    ? t("\nBeneficios de ejemplo: {{beneficios}}.", {
        beneficios: lista.map((beneficio) => `${beneficio.nombre} (${beneficio.costoPuntos} pts)`).join(", "),
      })
    : "";
  herramientas.decir(
    t(
      "Tienes {{disponibles}} puntos disponibles y {{pendientes}} pendientes de validación. Los puntos sólo se suman cuando se valida un reporte o una verificación (reglas del programa).{{ejemplos}}\nSon ejemplos: no hay descuentos ni patrocinios reales.",
      { disponibles: saldo.disponible, pendientes: saldo.pendientes, ejemplos },
    ),
  );
}

async function abrirMapa(herramientas: HerramientasEscenario, categoria: CategoriaReporte | null) {
  const recibo = await herramientas.accion("abrirMapa", categoria ? { categoria } : {});
  if (recibo.estado === "fallida") return falla(herramientas, recibo, msg("No pude abrir el mapa"));
  herramientas.decir(t("{{mensaje}} Si el mapa no carga, la vista de lista sigue funcionando.", { mensaje: t(recibo.mensaje) }));
}

/** Busca un control visible cuya etiqueta o id coincida con lo que pidió la persona. */
function objetivoParecido(herramientas: HerramientasEscenario, consulta: string): { id: string; etiqueta: string } | null {
  const palabras = consulta.split(" ").filter((palabra) => palabra.length >= 4);
  if (palabras.length === 0) return null;
  let mejor: { id: string; etiqueta: string; puntos: number } | null = null;
  for (const objetivo of herramientas.pantalla.objetivos) {
    const texto = normalizar(`${objetivo.etiqueta} ${objetivo.id.replace(/[._-]/g, " ")}`);
    const puntos = palabras.filter((palabra) => texto.includes(palabra) || texto.includes(palabra.replace(/s$/, ""))).length;
    if (puntos > 0 && (!mejor || puntos > mejor.puntos)) mejor = { ...objetivo, puntos };
  }
  return mejor ? { id: mejor.id, etiqueta: mejor.etiqueta } : null;
}

async function senalar(herramientas: HerramientasEscenario, consulta: string) {
  const objetivo = objetivoParecido(herramientas, consulta);
  if (objetivo) {
    const recibo = await herramientas.accion("senalarElemento", { objetivo: objetivo.id });
    herramientas.decir(recibo.estado === "completada" ? t("Aquí está: «{{etiqueta}}».", { etiqueta: objetivo.etiqueta }) : t(recibo.mensaje));
    return;
  }
  const seccion = seccionMencionada(consulta);
  if (seccion) {
    const recibo = await herramientas.accion("navegar", { seccion });
    herramientas.decir(
      recibo.estado === "completada"
        ? t("{{mensaje}} No lo veía en esta pantalla, así que te llevé ahí.", { mensaje: t(recibo.mensaje) })
        : t(recibo.mensaje),
    );
    return;
  }
  herramientas.decir(t("No veo ese control en esta pantalla. Dime qué quieres hacer y te llevo a la sección correcta."));
}

// --- Enrutador ---

export const escenariosGeneral: Escenarios = async (texto, n, herramientas) => {
  const { memoria } = herramientas;

  // 1) Seguridad primero: ante cualquier señal de riesgo, ayuda humana de inmediato.
  const riesgo = detectarRiesgo(texto);
  if (riesgo) {
    memoria.propuesta = null;
    memoria.esperandoTramite = false;
    await herramientas.accion("mostrarApoyoHumano", { motivo: riesgo });
    herramientas.decir(
      riesgo === "violencia"
        ? t(
            "Lo que cuentas es serio y no estás sola ni solo. Te mostré los canales de ayuda humana verificados. Si estás en peligro ahora, usa «Ayuda inmediata» para llamar a emergencias.",
          )
        : t(
            "Gracias por decírmelo. Lo más importante ahora es que hables con una persona: te mostré los canales de ayuda humana verificados. Si estás en peligro inmediato, usa «Ayuda inmediata».",
          ),
    );
    return;
  }

  // 2) Respuesta a una propuesta pendiente («¿Quieres ver los requisitos de…?»).
  const propuesta = memoria.propuesta;
  if (propuesta?.tipo === "requisitos" && esAfirmacion(n)) {
    memoria.propuesta = null;
    await mostrarRequisitos(herramientas, propuesta.servicioId);
    return;
  }
  if (propuesta && esNegacion(n)) {
    memoria.propuesta = null;
    herramientas.decir(t("Va. Escribe el nombre de otro trámite o elige uno de la lista en pantalla."));
    return;
  }
  memoria.propuesta = null;

  // 3) Intenciones.
  if (/\b(eres|estoy hablando con) (una |un )?(ia|inteligencia artificial|persona|humano|humana|real|robot|bot|oficial)\b|\bquien eres\b|\bque eres\b/.test(n)) {
    herramientas.decir(
      t(
        "No soy una persona: soy Peekito, un asistente virtual para orientarte en la app. Tampoco sustituyo la atención oficial: te ayudo a encontrar servicios, preparar reportes y moverte por aquí. Tú siempre confirmas antes de continuar.",
      ),
    );
    return;
  }
  if (/^(hola|buenas|buenos dias|buenas tardes|buenas noches|que tal|hey)\b/.test(n) && n.length <= 30) {
    herramientas.decir(
      t(
        "¡Hola! Puedo ayudarte a reportar un bache o una luminaria, consultar requisitos de un trámite, revisar un folio, encontrar apoyo psicológico, ver el mapa o tus beneficios. ¿Qué necesitas?",
      ),
    );
    return;
  }
  if (/^(gracias|muchas gracias|mil gracias|ok gracias|perfecto gracias)\b/.test(n)) {
    herramientas.decir(t("Con gusto. Aquí sigo si necesitas algo más."));
    return;
  }

  const folio = folioEscrito(texto);
  if (folio) {
    memoria.esperandoTramite = false;
    await consultarFolio(herramientas, folio);
    return;
  }

  const categoria = categoriaReporte(n);
  if (/\bmapa\b|visor urbano|donde hay|cuantos (baches|reportes)|ver (los )?(reportes|baches|incidencias)/.test(n)) {
    memoria.esperandoTramite = false;
    await abrirMapa(herramientas, categoria);
    return;
  }
  const pregunta = /^(como|donde|cuando|cuanto|que|por que)\b/.test(n);
  if (categoria && !pregunta && (contiene(n, VERBOS_REPORTE) || (CATEGORIAS_PROBLEMA.includes(categoria) && n.split(" ").length <= 8))) {
    memoria.esperandoTramite = false;
    await prepararReporte(herramientas, texto, categoria);
    return;
  }

  if (/negocio|licencia de funcionamiento|abrir un local|mi empresa|mi comercio|emprend/.test(n)) {
    memoria.esperandoTramite = false;
    await buscarYProponer(herramientas, "licencia de funcionamiento", t("Si ya iniciaste una gestión de tu negocio, también puedo abrir «Mis gestiones»."));
    return;
  }

  if (/requisito|documentos|papeles|que necesito para|que se necesita para|que piden para/.test(n)) {
    const tema = temaDeRequisitos(n);
    const enPantalla = servicioEnPantalla(herramientas);
    if (!tema && enPantalla) {
      memoria.esperandoTramite = false;
      await mostrarRequisitos(herramientas, enPantalla);
      return;
    }
    if (tema) {
      memoria.esperandoTramite = false;
      await buscarYProponer(herramientas, tema);
      return;
    }
    memoria.esperandoTramite = true;
    herramientas.decir(
      t("Claro. ¿De qué trámite? Escribe su nombre (por ejemplo, «licencia de funcionamiento») y busco sus requisitos en el catálogo."),
    );
    return;
  }

  if (/\bfolio\b|mi reporte|mis reportes|como va mi reporte|estado de mi reporte/.test(n)) {
    memoria.esperandoTramite = false;
    await consultarFolio(herramientas, null);
    return;
  }
  if (/mis gestiones|mis tramites|mi gestion|como va mi tramite|estado de mi tramite/.test(n)) {
    memoria.esperandoTramite = false;
    await consultarGestiones(herramientas);
    return;
  }

  if (/psicolog|salud mental|ansiedad|depresi|terapia|apoyo emocional|me siento (mal|triste|sola|solo|muy mal)|estres|hablar con alguien/.test(n)) {
    memoria.esperandoTramite = false;
    await apoyoPsicologico(herramientas);
    return;
  }

  if (/cultura|cultural|museo|teatro|concierto|festival|exposicion|actividades/.test(n)) {
    memoria.esperandoTramite = false;
    await buscarYProponer(herramientas, "cultura", t("La información de actividades puede cambiar: revisa la fuente de cada ficha."));
    return;
  }

  if (/beneficio|recompensa|\bpuntos\b|canje|canjear|premio/.test(n)) {
    memoria.esperandoTramite = false;
    await beneficios(herramientas);
    return;
  }

  const senal = /(?:donde (?:esta|queda|encuentro)|muestrame donde|ensename donde|senala(?:me)?|no encuentro|como llego a)\s+(.*)$/.exec(n);
  if (senal) {
    memoria.esperandoTramite = false;
    await senalar(herramientas, senal[1] ?? "");
    return;
  }

  const navegar = /(?:abre|abrir|llevame a|ir a|ve a|quiero ver|muestrame)\s+(.*)$/.exec(n);
  const seccion = navegar ? seccionMencionada(navegar[1] ?? "") : null;
  if (seccion) {
    memoria.esperandoTramite = false;
    const recibo = await herramientas.accion("navegar", { seccion });
    herramientas.decir(t(recibo.mensaje));
    return;
  }

  // 4) Respuesta al «¿de qué trámite?».
  if (memoria.esperandoTramite && n.length >= 3) {
    memoria.esperandoTramite = false;
    await buscarYProponer(herramientas, texto.trim().slice(0, 120));
    return;
  }

  const busqueda = /^(busco|buscar|necesito|quiero (sacar|tramitar|hacer|pagar)|como (saco|tramito|pago|hago)|tramite de|tramitar)\s+(.+)$/.exec(n);
  if (busqueda?.[3] && busqueda[3].length >= 3) {
    await buscarYProponer(herramientas, busqueda[3].slice(0, 120));
    return;
  }

  herramientas.decir(t("Todavía no sé ayudarte con eso. {{sugerencias}}", { sugerencias: t(SUGERENCIAS) }));
};
