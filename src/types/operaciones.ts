import type { EstadoInformacion, FechaISO, FuenteConsultada } from "./comunes";
import type { CategoriaReporte, EstadoMunicipal, EstadoVerificacionCiudadana, MotivoCancelacion, Ubicacion } from "./reportes";

/**
 * Centro de operaciones (demostración): bandeja unificada de incidencias para personas
 * funcionarias de cada dependencia del Ayuntamiento.
 *
 * Una `Incidencia` es una capa OPERATIVA: si viene de un reporte ciudadano, el estado municipal,
 * la ubicación y la descripción viven en el `Reporte` (una sola fuente de verdad) y la incidencia
 * sólo agrega canal, clasificación, propuesta, asignación, seguimiento interno y notas. Nada de lo
 * operativo se escribe en `Reporte.historial` (lo ve la ciudadanía).
 */

/**
 * Agrupación del prototipo (bandas del Laboratorio, Figma 32:162). «Salud y bienestar» queda fuera
 * a propósito: salud mental y Línea Mujer nunca aparecen como casos ni puntos (AGENTS §2.9, §2.10, §2.12).
 */
export type SectorId = "seguridad" | "movilidad" | "medio_ambiente" | "tramites" | "territorio";

/** Unidad administrativa tal como la publica Portal Ciudadano (nombre literal de la fuente). */
export interface Dependencia {
  /** Prefijo de la clave de trámite en minúsculas (p. ej. "sep" para MID-SEP-###). */
  id: string;
  /** Prefijo literal de la clave (p. ej. "SEP"). */
  prefijoClave: string;
  /** Nombre literal de la fuente (p. ej. "Servicios Públicos"). */
  nombre: string;
  /** Forma «Dirección de …» sólo cuando la propia fuente la usa. */
  nombreLargo?: string;
  /** Agrupación del prototipo: no es una estructura orgánica oficial. */
  sectores: SectorId[];
  /** Subáreas publicadas en fichas abiertas (verificadas). */
  subareasVerificadas: string[];
  fuente: FuenteConsultada;
  /** Confiabilidad del NOMBRE de la unidad (no de sus trámites). */
  estadoDeInformacion: EstadoInformacion;
}

/** Equipo o mesa de trabajo. Siempre ficticio en esta entrega. */
export interface EquipoDemo {
  id: string;
  dependenciaId: string;
  nombre: string;
  estadoDeInformacion: "demostracion";
}

export interface CatalogoAreasOperacion {
  dependencias: Dependencia[];
  equipos: EquipoDemo[];
  /** Fuente del listado de unidades (Portal Ciudadano). */
  fuente: FuenteConsultada;
  /** Aviso que acompaña la agrupación por sectores y el enrutamiento de demostración. */
  aviso: string;
}

/** Qué ve una identidad del Centro de operaciones. */
export type AmbitoOperacion =
  /** Coordinación: todos los sectores y dependencias. */
  | { tipo: "coordinacion" }
  /** Dirección: sólo los casos cuya dependencia responsable es la suya. */
  | { tipo: "dependencia"; dependenciaId: string };

/** Canal por el que llegó el caso. Todos son simulados (AGENTS §2.13: un canal no es una integración). */
export type CanalEntrada = "whatsapp" | "portal_ciudadano" | "telefono" | "app_ciudadana";

/**
 * Tipos operativos que NO son categorías de Mérida Móvil. Son ficticios y se rotulan
 * «Demostración»; nunca se agregan a `CategoriaReporte`.
 */
export type TipoOperativo =
  | "semaforo"
  | "obstruccion_banqueta"
  | "arbol_riesgo"
  | "ruido_vecinal"
  | "orientacion"
  | "riesgo_proteccion_civil"
  | "vehiculo_abandonado";

export type TipoIncidencia = CategoriaReporte | TipoOperativo;

/**
 * Etapa de la bandeja. Se DERIVA (nunca se guarda) del estado municipal y de la clasificación:
 * - registrado + clasificación sin revisar → "nueva"
 * - registrado + clasificación revisada → "por_asignar"
 * - en_proceso / solucionado / cancelado → igual que el estado municipal (etiquetas de Mérida Móvil).
 */
export type EtapaBandeja = "nueva" | "por_asignar" | "en_proceso" | "solucionado" | "cancelado";

export type NivelPrioridadCaso = "alta" | "media" | "baja";

/** Prioridad sugerida con criterios explícitos (estructura compatible con `src/domain/prioridad.ts`). */
export interface PrioridadCaso {
  nivel: NivelPrioridadCaso;
  puntaje: number;
  criterios: { id: "riesgo_declarado" | "antiguedad" | "tipo"; descripcion: string; peso: number }[];
  aviso: string;
}

export interface ClasificacionIncidencia {
  sectorId: SectorId;
  /** En esta entrega siempre "reglas_demo": la sugerencia es local y determinista, no IA real. */
  origen: "reglas_demo";
  /** Una persona confirmó la clasificación (pasa de «Nueva» a «Por asignar»). */
  revisada: boolean;
  revisadaPor?: string;
  fechaRevision?: FechaISO;
}

export interface FuentePropuesta {
  titulo: string;
  detalle: string;
  estadoDeInformacion: EstadoInformacion;
}

/** Propuesta de canalización preparada por reglas de demostración. Nunca se aplica sola. */
export interface PropuestaAsignacion {
  dependenciaId: string;
  equipoId?: string;
  justificacion: string;
  fuentes: FuentePropuesta[];
  origen: "reglas_demo";
  estado: "pendiente" | "confirmada" | "descartada";
  fecha: FechaISO;
  motivoDescarte?: string;
}

/** Asignación confirmada por una persona. */
export interface AsignacionIncidencia {
  dependenciaId: string;
  equipoId?: string;
  /** Id de la identidad de demostración que confirmó. */
  asignadaPor: string;
  fecha: FechaISO;
}

export type TipoEventoSeguimiento =
  | "recibido"
  | "clasificacion_sugerida"
  | "clasificacion_revisada"
  | "propuesta_preparada"
  | "propuesta_descartada"
  | "asignacion_confirmada"
  | "devuelta_a_coordinacion"
  | "atencion_registrada"
  | "cancelada"
  | "nota_agregada";

/** Seguimiento INTERNO (sólo Centro de operaciones; nunca en `Reporte.historial`). */
export interface EventoSeguimiento {
  id: string;
  fecha: FechaISO;
  tipo: TipoEventoSeguimiento;
  /** canal = entrada simulada; sistema_demo = reglas locales; persona = acción humana confirmada. */
  actor: "canal" | "sistema_demo" | "persona";
  autorId?: string;
  descripcion: string;
}

export interface NotaInterna {
  id: string;
  autorId: string;
  fecha: FechaISO;
  texto: string;
}

/** Datos propios de una incidencia que NO viene de un reporte ciudadano (llamada, WhatsApp, portal). */
export interface DatosIncidenciaPropia {
  descripcion: string;
  ubicacion: Ubicacion;
  riesgoDeclarado: boolean;
  creadoEn: FechaISO;
  /** Mismas transiciones que `Reporte` (src/domain/reportes.ts). */
  estadoMunicipal: EstadoMunicipal;
  motivoCancelacion?: MotivoCancelacion;
}

export type OrigenIncidencia =
  /** Envuelve un reporte de la app: su estado, ubicación y descripción se leen del `Reporte`. */
  | { tipo: "reporte"; reporteId: string }
  /** Caso recibido por otro canal; guarda sus propios datos. */
  | ({ tipo: "propia" } & DatosIncidenciaPropia);

export interface Incidencia {
  id: string;
  /** DEMO-R-#######. Igual al del reporte cuando lo envuelve; si no, generado en src/domain/folios.ts. */
  folio: string;
  origen: OrigenIncidencia;
  tipo: TipoIncidencia;
  canal: CanalEntrada;
  /** Texto ficticio del mensaje de entrada (WhatsApp, transcripción telefónica…). */
  mensajeOriginal?: string;
  clasificacion: ClasificacionIncidencia;
  propuesta?: PropuestaAsignacion;
  asignacion?: AsignacionIncidencia;
  seguimiento: EventoSeguimiento[];
  notas: NotaInterna[];
  actualizadoEn: FechaISO;
  semilla?: boolean;
}

/** Vista de un caso tal como la consume la interfaz (incidencia + datos del reporte + derivados). */
export interface CasoOperacion {
  id: string;
  folio: string;
  incidencia: Incidencia;
  reporteId?: string;
  tipo: TipoIncidencia;
  sectorId: SectorId;
  canal: CanalEntrada;
  descripcion: string;
  ubicacion: Ubicacion;
  riesgoDeclarado: boolean;
  creadoEn: FechaISO;
  actualizadoEn: FechaISO;
  estadoMunicipal: EstadoMunicipal;
  motivoCancelacion?: MotivoCancelacion;
  /** Verificación ciudadana (sólo casos que envuelven un reporte; "no_aplica" en los demás). */
  verificacion: EstadoVerificacionCiudadana;
  etapa: EtapaBandeja;
  prioridad: PrioridadCaso;
  /** asignacion?.dependenciaId ?? propuesta?.dependenciaId (si la propuesta no se descartó). */
  dependenciaResponsableId?: string;
}

export type OrdenBandeja = "recientes" | "antiguas" | "prioridad";

export interface FiltroBandeja {
  /** "abiertas" = nueva + por_asignar + en_proceso. Sin valor = todas. */
  etapa?: EtapaBandeja | "abiertas";
  sectores?: SectorId[];
  canales?: CanalEntrada[];
  prioridades?: NivelPrioridadCaso[];
  /** Busca en folio, tipo, descripción, colonia y referencia. */
  texto?: string;
  orden?: OrdenBandeja;
  /** Base 1. */
  pagina?: number;
  porPagina?: number;
}

export interface ConteosBandeja {
  /** Casos abiertos visibles para el ámbito (nueva + por_asignar + en_proceso). */
  abiertas: number;
  nuevas: number;
  porAsignar: number;
  enProceso: number;
  /** Casos con atención registrada hoy (solucionado). Nunca cuenta verificación ciudadana. */
  resueltasHoy: number;
}

export interface ResultadoBandeja {
  casos: CasoOperacion[];
  /** Total que cumple el filtro (antes de paginar). */
  total: number;
  pagina: number;
  porPagina: number;
  /** Conteos del ámbito completo (ignoran el filtro), para pestañas y resúmenes. */
  conteos: ConteosBandeja;
}

export interface EventoActividad {
  id: string;
  casoId: string;
  folio: string;
  fecha: FechaISO;
  tipo: TipoEventoSeguimiento;
  descripcion: string;
  canal: CanalEntrada;
  sectorId: SectorId;
}

export interface ResumenOperacion {
  conteos: ConteosBandeja;
  /** Casos abiertos registrados desde las 00:00 (America/Merida). */
  nuevasHoy: number;
  /** Casos abiertos con prioridad alta. */
  prioridadAlta: number;
  /** Casos abiertos por canal. */
  porCanal: Record<CanalEntrada, number>;
  /** Casos abiertos por sector (sólo sectores del ámbito; los demás en 0). */
  porSector: Record<SectorId, number>;
  /** Casos abiertos por colonia, de mayor a menor. Nunca decide la prioridad (AGENTS §2.8). */
  porColonia: { colonia: string; total: number }[];
  /** Eventos de seguimiento más recientes (máx. 10). */
  actividad: EventoActividad[];
  generadoEn: FechaISO;
}

export interface NuevaIncidenciaInput {
  tipo: TipoIncidencia;
  canal: Exclude<CanalEntrada, "app_ciudadana">;
  descripcion: string;
  ubicacion: Ubicacion;
  riesgoDeclarado: boolean;
  mensajeOriginal?: string;
}

export interface DestinoAsignacion {
  dependenciaId: string;
  equipoId?: string;
}
