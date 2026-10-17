/**
 * Ejecutor de acciones del asistente (patrón de Alex/Marea y Tricobot).
 *
 * - Valida nombre, ámbito y argumentos con el registro compartido (shared/asistente/acciones.ts).
 * - Nivel A: ejecuta (abrir, buscar, señalar, navegar) y devuelve datos compactos sin datos personales.
 * - Nivel B: PREPARA la pantalla con navigate(ruta, { state: { prefill } }) y devuelve
 *   "preparada_para_confirmar". Nunca envía formularios, reportes, pagos ni documentos.
 * - Nunca inventa folios: si no existe, lo dice.
 * - Señalar sólo acepta ids presentes en la pantalla actual.
 */
import {
  ACCIONES,
  accionesDelAmbito,
  SECCIONES,
  validarArgumentos,
  type AmbitoAsistente,
  type ArgumentosAccion,
  type NombreAccion,
  type ReciboAccion,
  type Seccion,
} from "@shared/asistente/acciones";
import type { PantallaActual } from "@shared/asistente/pantalla";
import type { MensajeReciente } from "@shared/asistente/servidor";
import type {
  FuenteCitada,
  LlamadaAccion,
  ProcedureRepository,
  ReportRepository,
  RewardRepository,
  ServiceCatalogRepository,
  WellbeingRepository,
} from "@/services/contracts";
import { msg } from "@/i18n";
import type {
  CategoriaReporte,
  EstadoGestion,
  EstadoMunicipal,
  EstadoNavegacionAsistente,
  Gestion,
  IdentidadDemo,
  LineaAyuda,
  Reporte,
  Servicio,
} from "@/types";
import { emitirActuacion } from "./acting-bus";
import type { ClienteConocimiento } from "./conocimiento";
import type { ClienteGuardas } from "./guardas";

/** Sólo los métodos que usa el ejecutor (el conjunto completo de repositorios también sirve). */
export interface RepositoriosEjecutor {
  catalog: Pick<ServiceCatalogRepository, "get" | "search">;
  procedures: Pick<ProcedureRepository, "list" | "findByFolio">;
  reports: Pick<ReportRepository, "list" | "findByFolio">;
  rewards: Pick<RewardRepository, "getRules" | "getBalance" | "listBenefits">;
  wellbeing: Pick<WellbeingRepository, "listHelpLines">;
}

export type MotivoApoyo = ArgumentosAccion<"mostrarApoyoHumano">["motivo"];

export type NavegarAsistente = (ruta: string, estado?: EstadoNavegacionAsistente) => void;

export interface ContextoEjecucion {
  ambito: AmbitoAsistente;
  repositorios: RepositoriosEjecutor;
  /** Identidad ficticia activa. */
  actor: IdentidadDemo;
  /** navigate de React Router (o un doble en pruebas). */
  navegar: NavegarAsistente;
  /** Pantalla vigente al ejecutar (para señalar y para elegir el objetivo del cursor). */
  pantalla: PantallaActual;
  /** Abre el panel de ayuda humana de la interfaz. Si no se da, se navega a la sección de ayuda. */
  abrirApoyoHumano?: (motivo: MotivoApoyo) => void;
  /** Guardas Clef para acciones de nivel B (opcional; sin ellas no hay señal). */
  guardas?: ClienteGuardas;
  /** Conocimiento verificado (RAG) del servidor. Sin él, la consulta responde que no pudo hacerse. */
  conocimiento?: ClienteConocimiento;
  mensajesRecientes?: readonly MensajeReciente[];
}

/** Rutas acordadas para cada sección del registro. */
export const RUTAS_SECCION: Record<Seccion, string> = {
  inicio: "/",
  servicios: "/servicios",
  reportes: "/reportes",
  mis_reportes: "/reportes/mis-reportes",
  mapa: "/mapa",
  bienestar: "/bienestar",
  salud_mental: "/bienestar/salud-mental",
  linea_mujer: "/bienestar/linea-mujer",
  participacion: "/participacion",
  expediente: "/expediente",
  gestiones: "/gestiones",
  notificaciones: "/notificaciones",
  cuenta: "/cuenta",
};

const NOMBRES_SECCION: Record<Seccion, string> = {
  inicio: msg("Inicio"),
  servicios: msg("Trámites y servicios"),
  reportes: msg("Reportes"),
  mis_reportes: msg("Mis reportes"),
  mapa: msg("Visor Urbano"),
  bienestar: msg("Bienestar"),
  salud_mental: msg("Salud mental"),
  linea_mujer: msg("Línea Mujer"),
  participacion: msg("Participación y recompensas"),
  expediente: msg("Mi expediente"),
  gestiones: msg("Mis gestiones"),
  notificaciones: msg("Notificaciones"),
  cuenta: msg("Cuenta de demostración"),
};

/** Nombres de Mérida Móvil («Selecciona un servicio»). */
export const NOMBRES_REPORTE: Record<CategoriaReporte, string> = {
  bache: msg("Bache a la vista"),
  luminaria: msg("Luminaria"),
  desazolve_rejilla: msg("Desazolve de rejilla"),
  basura_via_publica: msg("Basura en vía pública"),
  animal_muerto: msg("Animal muerto"),
  parques_jardines: msg("Parques y jardines"),
  recoleccion_basura: msg("Recolección de basura"),
};

/** Etiquetas de «Mis reportes» de Mérida Móvil. */
const ESTADOS_MUNICIPALES: Record<EstadoMunicipal, string> = {
  registrado: msg("Registrado"),
  en_proceso: msg("En proceso de atención"),
  solucionado: msg("Solucionado"),
  cancelado: msg("Cancelado"),
};

const ESTADOS_GESTION: Record<EstadoGestion, string> = {
  borrador: msg("Borrador"),
  enviada: msg("Enviada"),
  en_revision: msg("En revisión"),
  requiere_informacion: msg("Requiere información"),
  resuelta: msg("Resuelta"),
  cancelada: msg("Cancelada"),
};

const TIPOS_AYUDA: Record<MotivoApoyo, LineaAyuda["tipo"][]> = {
  salud_mental: ["salud_mental", "emergencia"],
  violencia: ["violencia", "emergencia"],
  emergencia: ["emergencia"],
  orientacion: ["orientacion", "salud_mental", "violencia", "emergencia"],
};

const RUTA_AYUDA: Record<MotivoApoyo, string> = {
  salud_mental: RUTAS_SECCION.salud_mental,
  violencia: RUTAS_SECCION.linea_mujer,
  emergencia: RUTAS_SECCION.bienestar,
  orientacion: RUTAS_SECCION.bienestar,
};

const FOLIO_DEMO = /^DEMO-[RGPCB]-[A-Z0-9]{1,20}$/;
const MAX_RESULTADOS = 5;

type Resultado = Omit<ReciboAccion, "llamadaId" | "accion">;

class FalloAccion extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "FalloAccion";
  }
}

const ERRORES_LEGIBLES = new Set([
  "SinConexionError",
  "IntegracionNoDisponibleError",
  "NoEncontradoError",
  "ReglaDeNegocioError",
  "PermisoDemoError",
  "FalloAccion",
]);

function mensajeDeError(error: unknown): string {
  if (error instanceof Error && ERRORES_LEGIBLES.has(error.name)) return error.message;
  return "No se pudo completar la acción. Puedes intentarlo de nuevo.";
}

function fuenteDeServicio(servicio: Servicio): FuenteCitada {
  return {
    titulo: servicio.fuenteOficial.nombre,
    url: servicio.fuenteOficial.url,
    ruta: `/servicios/${encodeURIComponent(servicio.id)}`,
    fechaConsulta: servicio.fuenteOficial.fechaConsulta,
    estadoDeInformacion: servicio.estadoDeInformacion,
  };
}

function servicioCompacto(servicio: Servicio) {
  return {
    id: servicio.id,
    nombre: servicio.nombreCiudadano ?? servicio.nombre,
    estadoDeInformacion: servicio.estadoDeInformacion,
    estadoDeIntegracion: servicio.estadoDeIntegracion,
    fuente: { nombre: servicio.fuenteOficial.nombre, url: servicio.fuenteOficial.url, fechaConsulta: servicio.fuenteOficial.fechaConsulta },
  };
}

function reporteCompacto(reporte: Reporte) {
  return {
    folio: reporte.folio,
    tipo: NOMBRES_REPORTE[reporte.categoria],
    estadoMunicipal: ESTADOS_MUNICIPALES[reporte.estadoMunicipal],
    verificacionCiudadana: reporte.verificacion,
    ...(reporte.ubicacion.colonia ? { colonia: reporte.ubicacion.colonia } : {}),
    actualizado: reporte.actualizadoEn.slice(0, 10),
  };
}

function gestionCompacta(gestion: Gestion) {
  return {
    folio: gestion.folio ?? "sin folio (borrador)",
    servicio: gestion.servicioNombre,
    estado: ESTADOS_GESTION[gestion.estado],
    actualizada: gestion.actualizadaEn.slice(0, 10),
  };
}

function normalizarFolio(folio: string): string {
  return folio.trim().toUpperCase().replace(/\s+/g, "").replace(/[‐-―]/g, "-");
}

/** Primer objetivo candidato que esté visible en la pantalla (para el cursor guía). */
function objetivoVisible(candidatos: readonly string[], pantalla: PantallaActual): string | null {
  return candidatos.find((candidato) => pantalla.objetivos.some((objetivo) => objetivo.id === candidato)) ?? null;
}

/**
 * Controles del AppShell que llevan a cada sección (data-guia de src/app/navigation.ts). En el
 * teléfono, las secciones que no caben en la barra inferior están en «Más» (nav.mas).
 */
const GUIAS_SECCION: Record<Seccion, readonly string[]> = {
  inicio: ["nav.inicio", "encabezado.inicio"],
  servicios: ["nav.servicios"],
  reportes: ["nav.reportes"],
  mis_reportes: ["reportes.mis_reportes", "nav.reportes"],
  mapa: ["nav.mapa"],
  bienestar: ["nav.bienestar"],
  salud_mental: ["nav.bienestar"],
  linea_mujer: ["nav.bienestar"],
  participacion: ["nav.participacion"],
  expediente: ["nav.expediente"],
  gestiones: ["nav.gestiones"],
  notificaciones: ["encabezado.notificaciones", "nav.notificaciones"],
  cuenta: ["nav.cuenta"],
};

function esSeccion(valor: string): valor is Seccion {
  return (SECCIONES as readonly string[]).includes(valor);
}

function guiasDeSeccion(seccion: string): string[] {
  return [...(esSeccion(seccion) ? GUIAS_SECCION[seccion] : []), `navegacion.${seccion}`, "nav.mas"];
}

function candidatosDeObjetivo(nombre: NombreAccion, argumentos: unknown): string[] {
  const valor = (clave: string): string => {
    if (typeof argumentos !== "object" || argumentos === null || !(clave in argumentos)) return "";
    const dato: unknown = Reflect.get(argumentos, clave);
    return typeof dato === "string" ? dato : "";
  };
  switch (nombre) {
    case "senalarElemento":
      return [valor("objetivo")];
    case "navegar":
      return guiasDeSeccion(valor("seccion"));
    case "prepararReporte":
      return [`reportes.${valor("categoria")}`, `reportes.${valor("categoria")}_a_la_vista`, ...guiasDeSeccion("reportes")];
    case "buscarServicios":
      return ["encabezado.buscador", "inicio.buscador", "servicios.buscador", ...guiasDeSeccion("servicios")];
    case "abrirMapa":
      return ["reportes.ver_mapa", ...guiasDeSeccion("mapa")];
    case "consultarReporte":
      return guiasDeSeccion("mis_reportes");
    case "consultarGestionesDemo":
      return ["inicio.ver_gestiones", ...guiasDeSeccion("gestiones")];
    case "explicarBeneficiosDemo":
      return guiasDeSeccion("participacion");
    case "mostrarApoyoHumano":
      return ["ayuda.inmediata", "bienestar.ayuda_inmediata", "salud_mental.ayuda_inmediata"];
    case "consultarConocimiento":
      return [];
    case "abrirServicio":
    case "consultarRequisitos":
    case "iniciarTramiteDemo":
      return ["servicios.iniciar", "ficha.iniciar", ...guiasDeSeccion("servicios")];
  }
}

async function obtenerServicio(contexto: ContextoEjecucion, servicioId: string): Promise<Servicio> {
  const servicio = await contexto.repositorios.catalog.get(servicioId);
  if (!servicio) throw new FalloAccion("No encontré ese servicio en el catálogo de servicios. Puedo buscarlo por nombre.");
  return servicio;
}

// --- Acciones de nivel A ---

/** Consulta de conocimiento: no navega ni toca la pantalla; sólo devuelve pasajes con su fuente. */
async function consultarConocimiento(contexto: ContextoEjecucion, { consulta }: ArgumentosAccion<"consultarConocimiento">): Promise<Resultado> {
  const respuesta = (await contexto.conocimiento?.buscar(consulta)) ?? null;
  if (!respuesta) {
    throw new FalloAccion(msg("No pude consultar la información en este momento. Inténtalo de nuevo en un momento."));
  }
  if (respuesta.pasajes.length === 0) {
    return {
      estado: "completada",
      mensaje: msg("No encontré información sobre eso en las fuentes de la plataforma."),
      datos: { consulta, pasajes: [], indicacion: msg("Sin información: dile a la persona que no la tienes y ofrécele lo que sí puedes hacer.") },
    };
  }
  const fuentes: FuenteCitada[] = [];
  for (const pasaje of respuesta.pasajes) {
    const repetida = fuentes.some((fuente) => fuente.titulo === pasaje.fuente.titulo && fuente.url === pasaje.fuente.url);
    if (repetida) continue;
    fuentes.push({
      titulo: pasaje.fuente.titulo,
      ...(pasaje.fuente.url ? { url: pasaje.fuente.url } : {}),
      ...(pasaje.ruta ? { ruta: pasaje.ruta } : {}),
      ...(pasaje.fuente.fechaConsulta ? { fechaConsulta: pasaje.fuente.fechaConsulta } : {}),
    });
  }
  return {
    estado: "completada",
    mensaje: respuesta.pasajes.length === 1 ? msg("Consulté 1 fuente de la plataforma.") : `Consulté ${respuesta.pasajes.length} fuentes de la plataforma.`,
    datos: {
      consulta,
      pasajes: respuesta.pasajes.map((pasaje) => ({ tipo: pasaje.tipo, titulo: pasaje.titulo, texto: pasaje.texto, fuente: pasaje.fuente.titulo, ...(pasaje.fuente.fechaConsulta ? { consultadaEl: pasaje.fuente.fechaConsulta } : {}), ...(pasaje.ruta ? { ruta: pasaje.ruta } : {}) })),
      fuentes,
    },
  };
}

async function buscarServicios(contexto: ContextoEjecucion, { consulta }: ArgumentosAccion<"buscarServicios">): Promise<Resultado> {
  const respuesta = await contexto.repositorios.catalog.search(consulta);
  const resultados = respuesta.resultados.slice(0, MAX_RESULTADOS).map((resultado) => resultado.servicio);
  contexto.navegar(`/buscar?q=${encodeURIComponent(consulta)}`);
  if (resultados.length === 0) {
    return {
      estado: "completada",
      mensaje: `No encontré servicios para «${consulta}» en el catálogo de servicios. Prueba con otras palabras.`,
      datos: { consulta, resultados: [] },
    };
  }
  return {
    estado: "completada",
    mensaje: `Encontré ${resultados.length} ${resultados.length === 1 ? msg("servicio") : msg("servicios")} para «${consulta}» y los mostré en pantalla.`,
    datos: { consulta, resultados: resultados.map(servicioCompacto), fuentes: resultados.map(fuenteDeServicio) },
  };
}

async function abrirServicio(contexto: ContextoEjecucion, { servicioId }: ArgumentosAccion<"abrirServicio">): Promise<Resultado> {
  const servicio = await obtenerServicio(contexto, servicioId);
  contexto.navegar(`/servicios/${encodeURIComponent(servicio.id)}`);
  return {
    estado: "completada",
    mensaje: `Abrí la ficha de «${servicio.nombreCiudadano ?? servicio.nombre}».`,
    datos: { servicio: servicioCompacto(servicio), fuentes: [fuenteDeServicio(servicio)] },
  };
}

async function consultarRequisitos(contexto: ContextoEjecucion, { servicioId }: ArgumentosAccion<"consultarRequisitos">): Promise<Resultado> {
  const servicio = await obtenerServicio(contexto, servicioId);
  contexto.navegar(`/servicios/${encodeURIComponent(servicio.id)}`, { enfocar: "requisitos" });
  const nombre = servicio.nombreCiudadano ?? servicio.nombre;
  const requisitos =
    servicio.requisitos === null
      ? "pendiente de verificar"
      : servicio.requisitos.slice(0, 15).map((requisito) => ({
          nombre: requisito.nombre,
          obligatorio: requisito.obligatorio,
          ...(requisito.presentacion ? { presentacion: requisito.presentacion } : {}),
        }));
  const costo = !servicio.costo || servicio.costo.tipo === "pendiente" ? "pendiente de verificar" : (servicio.costo.texto ?? servicio.costo.tipo);
  const pendiente = servicio.requisitos === null || servicio.estadoDeInformacion === "pendiente";
  return {
    estado: "completada",
    mensaje: pendiente
      ? `Abrí «${nombre}». Sus requisitos están pendientes de verificar: revisa la fuente oficial antes de hacer el trámite.`
      : `Abrí los requisitos de «${nombre}», tal como los publica la fuente.`,
    datos: {
      servicio: servicioCompacto(servicio),
      requisitos,
      costo,
      ...(servicio.tiempoDeRespuesta ? { tiempoDeRespuesta: servicio.tiempoDeRespuesta } : {}),
      fuentes: [fuenteDeServicio(servicio)],
    },
  };
}

async function consultarReporte(contexto: ContextoEjecucion, { folio }: ArgumentosAccion<"consultarReporte">): Promise<Resultado> {
  const { repositorios, actor } = contexto;
  if (!folio || !folio.trim()) {
    const propios = await repositorios.reports.list({ identidadId: actor.id });
    contexto.navegar(RUTAS_SECCION.mis_reportes);
    return {
      estado: "completada",
      mensaje:
        propios.length === 0
          ? "Abrí «Mis reportes». Todavía no tienes reportes."
          : `Abrí «Mis reportes». Tienes ${propios.length} ${propios.length === 1 ? "reporte" : "reportes"}.`,
      datos: { total: propios.length, recientes: propios.slice(0, MAX_RESULTADOS).map(reporteCompacto) },
    };
  }
  const normalizado = normalizarFolio(folio);
  if (!FOLIO_DEMO.test(normalizado)) {
    throw new FalloAccion(msg("Ese folio no tiene el formato esperado (DEMO-R-… para reportes o DEMO-G-… para gestiones)."));
  }
  if (normalizado.startsWith("DEMO-G-")) {
    const gestion = await repositorios.procedures.findByFolio(normalizado, actor);
    if (!gestion) throw new FalloAccion(`No encontré una gestión con el folio ${normalizado}. Revisa que esté bien escrito.`);
    contexto.navegar(`/gestiones/${encodeURIComponent(gestion.id)}`);
    return { estado: "completada", mensaje: `Abrí la gestión ${normalizado}.`, datos: { gestion: gestionCompacta(gestion) } };
  }
  const reporte = await repositorios.reports.findByFolio(normalizado);
  if (!reporte) throw new FalloAccion(`No encontré un reporte con el folio ${normalizado}. Revisa que esté bien escrito.`);
  contexto.navegar(`/reportes/${encodeURIComponent(reporte.id)}`);
  return {
    estado: "completada",
    mensaje: `Abrí el reporte ${reporte.folio}: «${ESTADOS_MUNICIPALES[reporte.estadoMunicipal]}».`,
    datos: { reporte: reporteCompacto(reporte) },
  };
}

function abrirMapa(contexto: ContextoEjecucion, argumentos: ArgumentosAccion<"abrirMapa">): Resultado {
  const parametros = new URLSearchParams();
  if (argumentos.categoria) parametros.set("categoria", argumentos.categoria);
  if (argumentos.vista) parametros.set("vista", argumentos.vista);
  if (argumentos.reporteId) parametros.set("reporte", argumentos.reporteId);
  const consulta = parametros.toString();
  contexto.navegar(`${RUTAS_SECCION.mapa}${consulta ? `?${consulta}` : ""}`, {
    prefill: {
      tipo: "mapa",
      origen: "asistente",
      ...(argumentos.categoria ? { categoria: argumentos.categoria } : {}),
      ...(argumentos.vista ? { vista: argumentos.vista } : {}),
      ...(argumentos.reporteId ? { reporteId: argumentos.reporteId } : {}),
    },
  });
  return {
    estado: "completada",
    mensaje: argumentos.categoria
      ? `Abrí el Visor Urbano con las incidencias de «${NOMBRES_REPORTE[argumentos.categoria]}».`
      : msg("Abrí el Visor Urbano con las incidencias."),
    datos: { categoria: argumentos.categoria ?? null, vista: argumentos.vista ?? "puntos", datosDeDemostracion: true },
  };
}

async function consultarGestionesDemo(contexto: ContextoEjecucion): Promise<Resultado> {
  const gestiones = await contexto.repositorios.procedures.list(contexto.actor);
  contexto.navegar(RUTAS_SECCION.gestiones);
  const porEstado: Partial<Record<string, number>> = {};
  for (const gestion of gestiones) {
    const etiqueta = ESTADOS_GESTION[gestion.estado];
    porEstado[etiqueta] = (porEstado[etiqueta] ?? 0) + 1;
  }
  return {
    estado: "completada",
    mensaje:
      gestiones.length === 0
        ? msg("Abrí «Mis gestiones». Todavía no tienes gestiones simuladas.")
        : `Abrí «Mis gestiones». Tienes ${gestiones.length} ${gestiones.length === 1 ? "gestión simulada" : "gestiones simuladas"}.`,
    datos: { total: gestiones.length, porEstado, recientes: gestiones.slice(0, MAX_RESULTADOS).map(gestionCompacta) },
  };
}

async function explicarBeneficiosDemo(contexto: ContextoEjecucion): Promise<Resultado> {
  const { rewards } = contexto.repositorios;
  const [reglas, saldo, beneficios] = await Promise.all([rewards.getRules(), rewards.getBalance(contexto.actor), rewards.listBenefits()]);
  contexto.navegar("/participacion/recompensas");
  return {
    estado: "completada",
    mensaje: `Abrí «Participación y recompensas». Tienes ${saldo.disponible} puntos disponibles y ${saldo.pendientes} pendientes de validación (reglas del programa).`,
    datos: {
      reglas: {
        etiqueta: reglas.etiqueta,
        reporteValidado: reglas.reporteValidado,
        verificacionBase: reglas.verificacionBase,
        verificacionBonoCalidad: reglas.verificacionBonoCalidad,
        verificacionNoConcluyente: reglas.verificacionNoConcluyente,
        aportacion: reglas.aportacion,
        descripcion: reglas.descripcion.slice(0, 8),
      },
      saldo,
      beneficios: beneficios.slice(0, MAX_RESULTADOS).map((beneficio) => ({
        nombre: beneficio.nombre,
        costoPuntos: beneficio.costoPuntos,
        disponible: beneficio.disponible,
        ejemplo: true,
      })),
      aviso: msg("Beneficios de ejemplo: no hay descuentos ni patrocinios reales."),
    },
  };
}

async function mostrarApoyoHumano(contexto: ContextoEjecucion, { motivo }: ArgumentosAccion<"mostrarApoyoHumano">): Promise<Resultado> {
  // Primero se muestra la ayuda (no depende de cargar datos ni de la conversación).
  if (contexto.abrirApoyoHumano) contexto.abrirApoyoHumano(motivo);
  else if (contexto.ambito === "general") contexto.navegar(RUTA_AYUDA[motivo]);
  let lineas: LineaAyuda[];
  try {
    const tipos = TIPOS_AYUDA[motivo];
    lineas = (await contexto.repositorios.wellbeing.listHelpLines()).filter((linea) => linea.verificado && tipos.includes(linea.tipo));
  } catch {
    lineas = [];
  }
  return {
    estado: "completada",
    mensaje: msg("Mostré en pantalla los canales de ayuda humana verificados."),
    datos: {
      motivo,
      lineas: lineas.slice(0, MAX_RESULTADOS).map((linea) => ({
        nombre: linea.nombre,
        telefono: linea.telefono,
        tipo: linea.tipo,
        ...(linea.disponibilidad ? { disponibilidad: linea.disponibilidad } : {}),
      })),
      fuentes: lineas.slice(0, MAX_RESULTADOS).map(
        (linea): FuenteCitada => ({ titulo: linea.fuente.nombre, url: linea.fuente.url, fechaConsulta: linea.fuente.fechaConsulta, estadoDeInformacion: "verificada" }),
      ),
    },
  };
}

function navegar(contexto: ContextoEjecucion, { seccion }: ArgumentosAccion<"navegar">): Resultado {
  contexto.navegar(RUTAS_SECCION[seccion]);
  return { estado: "completada", mensaje: `Abrí «${NOMBRES_SECCION[seccion]}».`, datos: { seccion, ruta: RUTAS_SECCION[seccion] } };
}

function senalarElemento(contexto: ContextoEjecucion, { objetivo }: ArgumentosAccion<"senalarElemento">): Resultado {
  const visible = contexto.pantalla.objetivos.find((candidato) => candidato.id === objetivo);
  if (!visible) throw new FalloAccion(msg("Ese elemento no está visible ahora."));
  emitirActuacion({ tipo: "point", objetivo: visible.id, etiqueta: visible.etiqueta });
  return { estado: "completada", mensaje: `Señalé «${visible.etiqueta}» en la pantalla.`, datos: { objetivo: visible.id } };
}

// --- Acciones de nivel B: preparan, nunca envían ---

function prepararReporte(contexto: ContextoEjecucion, argumentos: ArgumentosAccion<"prepararReporte">): Resultado {
  const nombre = NOMBRES_REPORTE[argumentos.categoria];
  contexto.navegar(`/reportes/nuevo/${argumentos.categoria}`, {
    prefill: {
      tipo: "reporte",
      categoria: argumentos.categoria,
      origen: "asistente",
      ...(argumentos.descripcion ? { descripcion: argumentos.descripcion } : {}),
      ...(argumentos.referenciaUbicacion ? { referenciaUbicacion: argumentos.referenciaUbicacion } : {}),
    },
  });
  return {
    estado: "preparada_para_confirmar",
    mensaje: `Abrí «${nombre}» con datos sugeridos. No se envió nada: la persona revisa, confirma la ubicación y lo envía.`,
    datos: { categoria: argumentos.categoria, formulario: nombre },
  };
}

async function iniciarTramiteDemo(contexto: ContextoEjecucion, { servicioId }: ArgumentosAccion<"iniciarTramiteDemo">): Promise<Resultado> {
  const servicio = await obtenerServicio(contexto, servicioId);
  contexto.navegar(`/servicios/${encodeURIComponent(servicio.id)}/iniciar`, {
    prefill: { tipo: "tramite", servicioId: servicio.id, origen: "asistente" },
  });
  return {
    estado: "preparada_para_confirmar",
    mensaje: `Abrí el formulario simulado de «${servicio.nombreCiudadano ?? servicio.nombre}». No se envió nada: la persona lo revisa y confirma.`,
    datos: { servicio: servicioCompacto(servicio), fuentes: [fuenteDeServicio(servicio)] },
  };
}

async function correr(nombre: NombreAccion, contexto: ContextoEjecucion, argumentos: unknown): Promise<Resultado> {
  switch (nombre) {
    case "buscarServicios": {
      const v = validarArgumentos(nombre, argumentos);
      return v.ok ? buscarServicios(contexto, v.valor) : invalidos(v.error);
    }
    case "consultarConocimiento": {
      const v = validarArgumentos(nombre, argumentos);
      return v.ok ? consultarConocimiento(contexto, v.valor) : invalidos(v.error);
    }
    case "abrirServicio": {
      const v = validarArgumentos(nombre, argumentos);
      return v.ok ? abrirServicio(contexto, v.valor) : invalidos(v.error);
    }
    case "consultarRequisitos": {
      const v = validarArgumentos(nombre, argumentos);
      return v.ok ? consultarRequisitos(contexto, v.valor) : invalidos(v.error);
    }
    case "prepararReporte": {
      const v = validarArgumentos(nombre, argumentos);
      return v.ok ? prepararReporte(contexto, v.valor) : invalidos(v.error);
    }
    case "consultarReporte": {
      const v = validarArgumentos(nombre, argumentos);
      return v.ok ? consultarReporte(contexto, v.valor) : invalidos(v.error);
    }
    case "abrirMapa": {
      const v = validarArgumentos(nombre, argumentos);
      return v.ok ? abrirMapa(contexto, v.valor) : invalidos(v.error);
    }
    case "consultarGestionesDemo": {
      const v = validarArgumentos(nombre, argumentos);
      return v.ok ? consultarGestionesDemo(contexto) : invalidos(v.error);
    }
    case "iniciarTramiteDemo": {
      const v = validarArgumentos(nombre, argumentos);
      return v.ok ? iniciarTramiteDemo(contexto, v.valor) : invalidos(v.error);
    }
    case "explicarBeneficiosDemo": {
      const v = validarArgumentos(nombre, argumentos);
      return v.ok ? explicarBeneficiosDemo(contexto) : invalidos(v.error);
    }
    case "mostrarApoyoHumano": {
      const v = validarArgumentos(nombre, argumentos);
      return v.ok ? mostrarApoyoHumano(contexto, v.valor) : invalidos(v.error);
    }
    case "navegar": {
      const v = validarArgumentos(nombre, argumentos);
      return v.ok ? navegar(contexto, v.valor) : invalidos(v.error);
    }
    case "senalarElemento": {
      const v = validarArgumentos(nombre, argumentos);
      return v.ok ? senalarElemento(contexto, v.valor) : invalidos(v.error);
    }
  }
}

function invalidos(error: string): Resultado {
  return { estado: "fallida", mensaje: `Los argumentos de la acción no son válidos (${error}). No se hizo nada.` };
}

/** Valida y ejecuta una llamada del proveedor. Nunca lanza: siempre devuelve un recibo. */
export async function ejecutarAccion(llamada: LlamadaAccion, contexto: ContextoEjecucion): Promise<ReciboAccion> {
  const { llamadaId, accion, argumentos } = llamada;
  // Una consulta de información no actúa sobre la pantalla: sin cursor, borde ni cesión del panel.
  const visible = accion !== "consultarConocimiento";
  const recibo = (resultado: Resultado): ReciboAccion => {
    if (visible) emitirActuacion({ tipo: "done", id: llamadaId, estado: resultado.estado });
    return { llamadaId, accion, ...resultado };
  };
  if (visible) emitirActuacion({ tipo: "intent", id: llamadaId, accion, objetivo: objetivoVisible(candidatosDeObjetivo(accion, argumentos), contexto.pantalla) });

  if (!accionesDelAmbito(contexto.ambito).includes(accion)) {
    return recibo({ estado: "fallida", mensaje: msg("Esa acción no está disponible en este espacio. No se hizo nada.") });
  }
  const validacion = validarArgumentos(accion, argumentos);
  if (!validacion.ok) return recibo(invalidos(validacion.error));

  const nivel = ACCIONES[accion].nivel;
  if (nivel !== "A" && contexto.guardas) {
    const guarda = await contexto.guardas.evaluarAccion({ accion, argumentos: validacion.valor, mensajesRecientes: contexto.mensajesRecientes ?? [] });
    if (guarda.decision === "preguntar") {
      return recibo({
        estado: "fallida",
        mensaje: msg("No preparé nada: antes pregunta a la persona si quiere que lo prepare."),
        datos: { motivo: "confirmar_con_la_persona" },
      });
    }
  }

  if (visible) emitirActuacion({ tipo: "run", id: llamadaId });
  try {
    return recibo(await correr(accion, contexto, validacion.valor));
  } catch (error) {
    return recibo({ estado: "fallida", mensaje: mensajeDeError(error) });
  }
}

/** Fuentes citables que trae un recibo (para la respuesta siguiente). */
export function fuentesDeRecibo(recibo: ReciboAccion): FuenteCitada[] {
  const datos = recibo.datos;
  if (typeof datos !== "object" || datos === null || !("fuentes" in datos)) return [];
  const fuentes: unknown = Reflect.get(datos, "fuentes");
  if (!Array.isArray(fuentes)) return [];
  const validas: FuenteCitada[] = [];
  for (const fuente of fuentes) {
    if (typeof fuente !== "object" || fuente === null) continue;
    const titulo: unknown = Reflect.get(fuente, "titulo");
    if (typeof titulo !== "string" || !titulo.trim()) continue;
    const url: unknown = Reflect.get(fuente, "url");
    const ruta: unknown = Reflect.get(fuente, "ruta");
    const fecha: unknown = Reflect.get(fuente, "fechaConsulta");
    const estado: unknown = Reflect.get(fuente, "estadoDeInformacion");
    validas.push({
      titulo,
      ...(typeof url === "string" ? { url } : {}),
      ...(typeof ruta === "string" ? { ruta } : {}),
      ...(typeof fecha === "string" ? { fechaConsulta: fecha } : {}),
      ...(estado === "verificada" || estado === "pendiente" || estado === "demostracion" ? { estadoDeInformacion: estado } : {}),
    });
  }
  return validas;
}
