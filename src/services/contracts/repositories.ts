/**
 * Contratos de la capa de servicios. Los componentes consumen estos contratos a través de
 * los hooks de src/services/hooks; nunca importan datos simulados directamente.
 *
 * Implementaciones:
 * - src/services/adapters/demo: simulación local (localStorage con datos ficticios).
 * - src/services/adapters/http: esqueleto para integraciones reales; hoy lanzan
 *   IntegracionNoDisponibleError (ver docs/INTEGRACIONES.md).
 *
 * Las operaciones que dependen de quién actúa reciben `actor` (identidad de demostración activa).
 * En una integración real, identidad, permisos, validaciones y saldos se controlan en el servidor.
 */
import type {
  BeneficioDemo,
  BorradorGestionInput,
  CampoReutilizable,
  CanjeDemo,
  Categoria,
  CitaDemo,
  CoberturaCatalogo,
  DemandaAgregada,
  DocumentoDemo,
  FiltroCatalogo,
  FiltroReportes,
  Gestion,
  IdentidadDemo,
  LineaAyuda,
  MotivoCancelacion,
  MovimientoPuntos,
  NuevaVerificacionInput,
  NuevoReporteInput,
  Notificacion,
  PagoDemo,
  PerfilDemo,
  PosibleDuplicado,
  PreferenciasPrivacidad,
  ProgramaBienestar,
  AreaBienestar,
  ReglasPuntosDemo,
  Reporte,
  RespuestaBusqueda,
  SaldoPuntos,
  Servicio,
  SolicitudApoyoDemo,
  Ubicacion,
  UbicacionServicio,
  Verificacion,
  CategoriaReporte,
} from "@/types";

export interface ServiceCatalogRepository {
  listCategories(): Promise<Categoria[]>;
  list(filtro?: FiltroCatalogo): Promise<Servicio[]>;
  get(id: string): Promise<Servicio | null>;
  /** Búsqueda en lenguaje natural: intención + resultados con acciones concretas. */
  search(consulta: string): Promise<RespuestaBusqueda>;
  coverage(): Promise<CoberturaCatalogo>;
}

export interface ProcedureRepository {
  list(actor: IdentidadDemo): Promise<Gestion[]>;
  get(id: string, actor: IdentidadDemo): Promise<Gestion | null>;
  findByFolio(folio: string, actor: IdentidadDemo): Promise<Gestion | null>;
  saveDraft(input: BorradorGestionInput, actor: IdentidadDemo): Promise<Gestion>;
  /** Asigna folio DEMO-G-... Idempotente: enviar dos veces no crea dos gestiones. */
  submit(id: string, actor: IdentidadDemo): Promise<Gestion>;
  cancel(id: string, actor: IdentidadDemo): Promise<Gestion>;
  /** Pago simulado; nunca procesa tarjetas reales. */
  simulatePayment(
    input: { gestionId?: string; concepto: string; montoDemo: number; metodo: PagoDemo["metodo"]; resultado?: "aprobado" | "rechazado" },
    actor: IdentidadDemo,
  ): Promise<PagoDemo>;
  requestAppointment(input: { servicioId: string; fecha: string; hora: string; sede: string }, actor: IdentidadDemo): Promise<CitaDemo>;
}

export interface ReportRepository {
  list(filtro?: FiltroReportes): Promise<Reporte[]>;
  get(id: string): Promise<Reporte | null>;
  findByFolio(folio: string): Promise<Reporte | null>;
  findPossibleDuplicates(input: { categoria: CategoriaReporte; ubicacion: Ubicacion }): Promise<PosibleDuplicado[]>;
  /** Crea el reporte y un movimiento de puntos PENDIENTE (no suma hasta la validación). */
  create(input: NuevoReporteInput, actor: IdentidadDemo): Promise<Reporte>;
  /** "Es el mismo incidente: aportar información". No crea reporte ni puntos. */
  addContribution(reporteId: string, input: { descripcion: string; tieneFoto: boolean }, actor: IdentidadDemo): Promise<Reporte>;
  followUp(reporteId: string, tipo: "asignado" | "contacto_simulado", texto: string, actor: IdentidadDemo): Promise<Reporte>;
  // --- Operador de demostración ---
  /** registrado -> en_proceso; aprueba el movimiento pendiente del reporte. */
  validate(reporteId: string, actor: IdentidadDemo): Promise<Reporte>;
  /** en_proceso -> solucionado ("atención reportada"); abre la verificación ciudadana. */
  registerAttention(reporteId: string, nota: string, actor: IdentidadDemo): Promise<Reporte>;
  /** Cancela y cancela/revierte los puntos asociados con motivo. */
  cancel(reporteId: string, motivo: MotivoCancelacion, actor: IdentidadDemo): Promise<Reporte>;
}

export interface VerificationRepository {
  /** Reportes con atención reportada que la identidad puede verificar (excluye los propios). */
  listVerifiable(actor: IdentidadDemo): Promise<Reporte[]>;
  listMine(actor: IdentidadDemo): Promise<Verificacion[]>;
  listByReport(reporteId: string): Promise<Verificacion[]>;
  /** Rechaza verificar el propio reporte y verificar dos veces el mismo reporte. */
  submit(input: NuevaVerificacionInput, actor: IdentidadDemo): Promise<Verificacion>;
  // --- Operador de demostración ---
  listForReview(actor: IdentidadDemo): Promise<Verificacion[]>;
  /** Aprueba y acredita puntos una sola vez (clave de evento). */
  approve(id: string, actor: IdentidadDemo): Promise<Verificacion>;
  reject(id: string, motivo: string, actor: IdentidadDemo): Promise<Verificacion>;
  /** Revierte una aprobación y registra un movimiento de reversión con motivo. */
  revert(id: string, motivo: string, actor: IdentidadDemo): Promise<Verificacion>;
}

export interface RewardRepository {
  getRules(): Promise<ReglasPuntosDemo>;
  getBalance(actor: IdentidadDemo): Promise<SaldoPuntos>;
  listMovements(actor: IdentidadDemo): Promise<MovimientoPuntos[]>;
  listBenefits(): Promise<BeneficioDemo[]>;
  listRedemptions(actor: IdentidadDemo): Promise<CanjeDemo[]>;
  /** Falla con ReglaDeNegocioError("saldo_insuficiente") si no alcanza: nunca deja saldo negativo. */
  redeem(beneficioId: string, actor: IdentidadDemo): Promise<CanjeDemo>;
}

export interface DigitalFileRepository {
  getProfile(actor: IdentidadDemo): Promise<PerfilDemo>;
  listDocuments(actor: IdentidadDemo): Promise<DocumentoDemo[]>;
  getDocument(id: string, actor: IdentidadDemo): Promise<DocumentoDemo | null>;
  listReusableFields(actor: IdentidadDemo): Promise<CampoReutilizable[]>;
  getPrivacy(actor: IdentidadDemo): Promise<PreferenciasPrivacidad>;
  updatePrivacy(cambios: Partial<Omit<PreferenciasPrivacidad, "confirmarAntesDeReutilizar">>, actor: IdentidadDemo): Promise<PreferenciasPrivacidad>;
}

export interface WellbeingRepository {
  listPrograms(area?: AreaBienestar): Promise<ProgramaBienestar[]>;
  listHelpLines(): Promise<LineaAyuda[]>;
  listServiceLocations(): Promise<UbicacionServicio[]>;
  /** Solicitud simulada: nunca confirma que alguien la recibió ni que hay cita. */
  requestSupportDemo(tipo: SolicitudApoyoDemo["tipo"]): Promise<SolicitudApoyoDemo>;
  /** Sólo operador/administración; aplica umbral mínimo. Datos ficticios, nunca derivados de conversaciones. */
  getAggregatedDemand(actor: IdentidadDemo): Promise<DemandaAgregada>;
}

export interface NotificationRepository {
  list(actor: IdentidadDemo): Promise<Notificacion[]>;
  markRead(id: string, actor: IdentidadDemo): Promise<void>;
  markAllRead(actor: IdentidadDemo): Promise<void>;
}

/** Conjunto de repositorios que expone el registro (src/services/registry.ts). */
export interface Repositories {
  catalog: ServiceCatalogRepository;
  procedures: ProcedureRepository;
  reports: ReportRepository;
  verifications: VerificationRepository;
  rewards: RewardRepository;
  digitalFile: DigitalFileRepository;
  wellbeing: WellbeingRepository;
  notifications: NotificationRepository;
}
