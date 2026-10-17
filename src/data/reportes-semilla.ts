import { formatearFolio } from "@/domain/folios";
import type {
  CategoriaReporte,
  EstadoMunicipal,
  EventoReporte,
  MotivoCancelacion,
  Reporte,
  Verificacion,
} from "@/types";
import { COLONIAS_DEMO } from "./colonias";

/**
 * Reportes FICTICIOS de la demostración repartidos en Mérida (lat 20.90–21.06, lng −89.72 a −89.55).
 * Las fechas se calculan relativas al momento de la siembra. Las ubicaciones son aproximadas y no
 * corresponden a incidentes reales.
 *
 * Semillas especiales para los recorridos:
 * - rep-0001: bache «Registrado» de Bruno en Centro, calle 60 x 59 y 61 (probar duplicados).
 * - rep-0002: luminaria de Ana «Solucionado», sin verificaciones (Bruno puede verificarla).
 * - rep-0003: bache de Bruno «Solucionado», verificado por Ana (verificación aprobada: «coincide»).
 * - rep-0004 y rep-0005: reportes de Ana «En proceso de atención» y «Registrado».
 * - rep-0006: rejilla de una vecina ficticia «Solucionado» con verificación de Bruno pendiente de revisión.
 * - rep-0007 a rep-0010: «En proceso de atención» para que el operador registre la atención.
 */

export const IDS_SEMILLA = {
  bacheCentroBruno: "rep-0001",
  luminariaAnaSolucionada: "rep-0002",
  bacheBrunoVerificadoPorAna: "rep-0003",
  anaEnProceso: "rep-0004",
  anaRegistrado: "rep-0005",
  rejillaConVerificacionPendiente: "rep-0006",
  enProcesoParaOperador: ["rep-0007", "rep-0008", "rep-0009", "rep-0010"],
  verificacionAnaAprobada: "ver-0001",
  verificacionBrunoPendiente: "ver-0002",
} as const;

export const TOTAL_REPORTES_SEMILLA = 60;

const DIA = 86_400_000;

function haceDias(ahora: Date, dias: number, horas = 0): string {
  return new Date(ahora.getTime() - dias * DIA - horas * 3_600_000).toISOString();
}

/** Generador pseudoaleatorio determinista (mulberry32): las semillas son reproducibles. */
function generador(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const DESCRIPCIONES: Record<CategoriaReporte, readonly string[]> = {
  bache: [
    "Bache profundo a mitad del carril; los coches se orillan para esquivarlo.",
    "Hoyo en la calle frente a la tienda de la esquina; crece con cada lluvia.",
    "Bache de unos 50 cm junto al tope, peligroso para motos y bicicletas.",
    "Varios baches seguidos en la cuadra, el pavimento se está desprendiendo.",
  ],
  luminaria: [
    "La luminaria del poste de la esquina no enciende desde hace varios días.",
    "Foco parpadeando toda la noche; la calle queda casi a oscuras.",
    "Dos luminarias apagadas seguidas en la cuadra, se ve muy oscuro al caminar.",
  ],
  desazolve_rejilla: [
    "La rejilla está tapada con hojas y basura; se encharca cuando llueve.",
    "Rejilla pluvial obstruida, el agua se queda estancada en la esquina.",
  ],
  basura_via_publica: [
    "Montón de basura y cacharros en la banqueta junto al parque.",
    "Bolsas de basura abandonadas en el camellón desde el fin de semana.",
  ],
  animal_muerto: [
    "Perro sin vida a un lado de la calle, cerca del cruce.",
    "Animal muerto sobre la avenida, junto a la parada del camión.",
  ],
  parques_jardines: [
    "El parque necesita limpieza: hay maleza alta y hojas acumuladas.",
    "Maleza crecida en el área verde; ya cubre parte de los juegos infantiles.",
  ],
  recoleccion_basura: [
    "El camión de la basura no ha pasado por esta calle desde hace una semana.",
    "No pasó la recolección el día que corresponde; las bolsas siguen afuera.",
  ],
};

/** Personas ficticias que no son identidades activas de la demostración. */
const VECINDAD_FICTICIA = ["vecina-01", "vecino-02", "vecina-03", "vecino-04", "vecina-05", "vecino-06"];

interface PlanReporte {
  categoria: CategoriaReporte;
  estado: EstadoMunicipal;
  colonia: string;
  lat: number;
  lng: number;
  referencia: string;
  descripcion: string;
  diasAtras: number;
  identidadId: string;
  riesgoDeclarado: boolean;
  tieneFoto: boolean;
  motivoCancelacion?: MotivoCancelacion;
  verificacion?: Reporte["verificacion"];
}

const ESPECIALES: PlanReporte[] = [
  {
    categoria: "bache",
    estado: "registrado",
    colonia: "Centro",
    lat: 20.9696,
    lng: -89.6229,
    referencia: "Calle 60 x 59 y 61",
    descripcion: "Bache grande en el carril derecho de la calle 60, frente al parque; los coches frenan de golpe.",
    diasAtras: 3,
    identidadId: "bruno",
    riesgoDeclarado: true,
    tieneFoto: true,
  },
  {
    categoria: "luminaria",
    estado: "solucionado",
    colonia: "García Ginerés",
    lat: 20.9812,
    lng: -89.6391,
    referencia: "Calle 25 x 28 y 30",
    descripcion: "La luminaria frente al número 300 no enciende y la esquina queda muy oscura en la noche.",
    diasAtras: 12,
    identidadId: "ana",
    riesgoDeclarado: false,
    tieneFoto: false,
    verificacion: "pendiente",
  },
  {
    categoria: "bache",
    estado: "solucionado",
    colonia: "Itzimná",
    lat: 20.9958,
    lng: -89.6105,
    referencia: "Calle 21 x 22 y 24",
    descripcion: "Bache profundo frente a la escuela; a la hora de salida es peligroso para quienes cruzan.",
    diasAtras: 20,
    identidadId: "bruno",
    riesgoDeclarado: true,
    tieneFoto: true,
    verificacion: "coincide",
  },
  {
    categoria: "desazolve_rejilla",
    estado: "en_proceso",
    colonia: "Santa Rosa",
    lat: 20.9541,
    lng: -89.6182,
    referencia: "Calle 46 x 95 y 97",
    descripcion: "La rejilla de la esquina está tapada y cuando llueve el agua llega a la banqueta.",
    diasAtras: 8,
    identidadId: "ana",
    riesgoDeclarado: false,
    tieneFoto: true,
  },
  {
    categoria: "basura_via_publica",
    estado: "registrado",
    colonia: "México",
    lat: 21.0018,
    lng: -89.6159,
    referencia: "Calle 19 x 14 y 16",
    descripcion: "Bolsas de basura y ramas acumuladas junto al poste desde hace varios días.",
    diasAtras: 1,
    identidadId: "ana",
    riesgoDeclarado: false,
    tieneFoto: false,
  },
  {
    categoria: "desazolve_rejilla",
    estado: "solucionado",
    colonia: "Pensiones",
    lat: 20.9941,
    lng: -89.6651,
    referencia: "Calle 5-D x 58 y 60",
    descripcion: "Rejilla pluvial obstruida con tierra; se forma un charco grande en la esquina.",
    diasAtras: 15,
    identidadId: "vecina-01",
    riesgoDeclarado: false,
    tieneFoto: true,
    verificacion: "pendiente",
  },
  {
    categoria: "bache",
    estado: "en_proceso",
    colonia: "Chuburná de Hidalgo",
    lat: 21.0128,
    lng: -89.6399,
    referencia: "Calle 20 x 21 y 23",
    descripcion: "Bache en la entrada de la calle; las motos tienen que salirse del carril.",
    diasAtras: 6,
    identidadId: "vecino-02",
    riesgoDeclarado: true,
    tieneFoto: true,
  },
  {
    categoria: "luminaria",
    estado: "en_proceso",
    colonia: "Juan Pablo II",
    lat: 21.0111,
    lng: -89.6739,
    referencia: "Calle 26 x 5-D y 5-F",
    descripcion: "Tres luminarias apagadas frente al parque; la gente evita pasar por ahí de noche.",
    diasAtras: 9,
    identidadId: "vecina-03",
    riesgoDeclarado: true,
    tieneFoto: false,
  },
  {
    categoria: "parques_jardines",
    estado: "en_proceso",
    colonia: "Vergel",
    lat: 20.9731,
    lng: -89.5752,
    referencia: "Calle 15-B x 10-B y 10-C",
    descripcion: "Maleza alta en el parque de la colonia; ya no se pueden usar las bancas.",
    diasAtras: 11,
    identidadId: "vecino-04",
    riesgoDeclarado: false,
    tieneFoto: true,
  },
  {
    categoria: "animal_muerto",
    estado: "en_proceso",
    colonia: "Xoclán",
    lat: 20.9673,
    lng: -89.6731,
    referencia: "Calle 61 x 114 y 118",
    descripcion: "Animal muerto sobre la banqueta cerca de la parada; empieza a oler muy fuerte.",
    diasAtras: 2,
    identidadId: "vecina-05",
    riesgoDeclarado: false,
    tieneFoto: false,
  },
];

/** Reparto aproximado del resto: bache ~40 %, luminaria ~25 %, resto de tipos. */
const CATEGORIAS_RESTO: CategoriaReporte[] = [
  ...Array<CategoriaReporte>(19).fill("bache"),
  ...Array<CategoriaReporte>(12).fill("luminaria"),
  ...Array<CategoriaReporte>(5).fill("desazolve_rejilla"),
  ...Array<CategoriaReporte>(5).fill("basura_via_publica"),
  ...Array<CategoriaReporte>(2).fill("animal_muerto"),
  ...Array<CategoriaReporte>(3).fill("parques_jardines"),
  ...Array<CategoriaReporte>(4).fill("recoleccion_basura"),
];

const ESTADOS_RESTO: EstadoMunicipal[] = ["registrado", "registrado", "en_proceso", "solucionado", "solucionado", "registrado", "en_proceso", "cancelado"];
const MOTIVOS: MotivoCancelacion[] = ["duplicado", "no_procede", "fuera_de_competencia", "informacion_insuficiente"];

const LIMITES = { latMin: 20.9, latMax: 21.06, lngMin: -89.72, lngMax: -89.55 };

function planesGenerados(): PlanReporte[] {
  const azar = generador(20261017);
  const colonias = COLONIAS_DEMO.filter(
    (c) => c.lat >= LIMITES.latMin && c.lat <= LIMITES.latMax && c.lng >= LIMITES.lngMin && c.lng <= LIMITES.lngMax,
  );
  return CATEGORIAS_RESTO.map((categoria, indice) => {
    const colonia = colonias[Math.floor(azar() * colonias.length)] ?? colonias[0];
    if (!colonia) throw new Error("No hay colonias de demostración dentro de los límites.");
    const estado = ESTADOS_RESTO[indice % ESTADOS_RESTO.length] ?? "registrado";
    const descripciones = DESCRIPCIONES[categoria];
    const lat = Math.min(LIMITES.latMax, Math.max(LIMITES.latMin, colonia.lat + (azar() - 0.5) * 0.012));
    const lng = Math.min(LIMITES.lngMax, Math.max(LIMITES.lngMin, colonia.lng + (azar() - 0.5) * 0.012));
    const calle = 2 * Math.floor(azar() * 60) + 10;
    const cruce = 2 * Math.floor(azar() * 60) + 11;
    const plan: PlanReporte = {
      categoria,
      estado,
      colonia: colonia.nombre,
      lat: Math.round(lat * 1e5) / 1e5,
      lng: Math.round(lng * 1e5) / 1e5,
      referencia: `Calle ${calle} x ${cruce} y ${cruce + 2}`,
      descripcion: descripciones[Math.floor(azar() * descripciones.length)] ?? descripciones[0] ?? "Incidente de demostración.",
      diasAtras: Math.floor(azar() * 40) + (estado === "registrado" ? 0 : 4),
      identidadId: VECINDAD_FICTICIA[Math.floor(azar() * VECINDAD_FICTICIA.length)] ?? "vecina-01",
      riesgoDeclarado: azar() < 0.3,
      tieneFoto: azar() < 0.6,
    };
    if (estado === "cancelado") plan.motivoCancelacion = MOTIVOS[indice % MOTIVOS.length] ?? "no_procede";
    if (estado === "solucionado") plan.verificacion = "pendiente";
    return plan;
  });
}

function historialDe(plan: PlanReporte, folio: string, ahora: Date): EventoReporte[] {
  const eventos: EventoReporte[] = [
    { fecha: haceDias(ahora, plan.diasAtras, 2), tipo: "creado", descripcion: `Reporte registrado con folio ${folio} (simulado).`, actor: "ciudadania" },
  ];
  const validado = Math.max(plan.diasAtras - 1, 0);
  if (plan.estado === "en_proceso" || plan.estado === "solucionado") {
    eventos.push({ fecha: haceDias(ahora, validado, 1), tipo: "validado", descripcion: "Reporte validado: en proceso de atención (simulado).", actor: "operador" });
  }
  if (plan.estado === "solucionado") {
    eventos.push({
      fecha: haceDias(ahora, Math.max(validado - 2, 0)),
      tipo: "atencion_registrada",
      descripcion: "Atención reportada por el Ayuntamiento (simulado).",
      actor: "operador",
    });
  }
  if (plan.estado === "cancelado" && plan.motivoCancelacion) {
    eventos.push({ fecha: haceDias(ahora, validado), tipo: "cancelado", descripcion: "Reporte cancelado (simulado).", actor: "operador" });
  }
  return eventos;
}

export function crearReportesSemilla(ahora: Date): Reporte[] {
  const planes = [...ESPECIALES, ...planesGenerados()].slice(0, TOTAL_REPORTES_SEMILLA);
  return planes.map((plan, indice) => {
    const numero = indice + 1;
    const id = `rep-${String(numero).padStart(4, "0")}`;
    const folio = formatearFolio("reporte", numero);
    const historial = historialDe(plan, folio, ahora);
    const reporte: Reporte = {
      id,
      folio,
      categoria: plan.categoria,
      descripcion: plan.descripcion,
      ubicacion: { lat: plan.lat, lng: plan.lng, referencia: plan.referencia, colonia: plan.colonia, origen: "mapa" },
      tieneFoto: plan.tieneFoto,
      riesgoDeclarado: plan.riesgoDeclarado,
      identidadId: plan.identidadId,
      creadoEn: historial[0]?.fecha ?? haceDias(ahora, plan.diasAtras),
      actualizadoEn: historial.at(-1)?.fecha ?? haceDias(ahora, plan.diasAtras),
      estadoMunicipal: plan.estado,
      verificacion: plan.verificacion ?? "no_aplica",
      historial,
      aportaciones: [],
      semilla: true,
    };
    if (plan.motivoCancelacion) reporte.motivoCancelacion = plan.motivoCancelacion;
    if (id === IDS_SEMILLA.bacheBrunoVerificadoPorAna) {
      reporte.historial = [
        ...reporte.historial,
        { fecha: haceDias(ahora, 14), tipo: "verificacion_recibida", descripcion: "Se recibió una verificación ciudadana.", actor: "ciudadania" },
        { fecha: haceDias(ahora, 13), tipo: "verificacion_aprobada", descripcion: "El operador aprobó una verificación ciudadana.", actor: "operador" },
      ];
      reporte.actualizadoEn = haceDias(ahora, 13);
    }
    if (id === IDS_SEMILLA.rejillaConVerificacionPendiente) {
      reporte.historial = [
        ...reporte.historial,
        { fecha: haceDias(ahora, 2), tipo: "verificacion_recibida", descripcion: "Se recibió una verificación ciudadana.", actor: "ciudadania" },
      ];
      reporte.actualizadoEn = haceDias(ahora, 2);
    }
    return reporte;
  });
}

export function crearVerificacionesSemilla(ahora: Date): Verificacion[] {
  return [
    {
      id: IDS_SEMILLA.verificacionAnaAprobada,
      reporteId: IDS_SEMILLA.bacheBrunoVerificadoPorAna,
      reporteFolio: formatearFolio("reporte", 3),
      identidadId: "ana",
      fecha: haceDias(ahora, 14),
      resultado: "reparacion_completada",
      comentario: "Pasé por la mañana: el bache ya está tapado y el pavimento quedó parejo.",
      calidad: { descripcionUtil: true, ubicacionConfirmada: true, evidencia: false },
      estadoRevision: "aprobada",
      revisadaPor: "operador",
    },
    {
      id: IDS_SEMILLA.verificacionBrunoPendiente,
      reporteId: IDS_SEMILLA.rejillaConVerificacionPendiente,
      reporteFolio: formatearFolio("reporte", 6),
      identidadId: "bruno",
      fecha: haceDias(ahora, 2),
      resultado: "problema_persiste",
      comentario: "La rejilla sigue tapada con tierra; con la lluvia de ayer se volvió a encharcar.",
      calidad: { descripcionUtil: true, ubicacionConfirmada: true, evidencia: true },
      estadoRevision: "pendiente_revision",
    },
  ];
}
