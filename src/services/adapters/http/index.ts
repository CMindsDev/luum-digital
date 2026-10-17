import {
  IntegracionNoDisponibleError,
  type DigitalFileRepository,
  type NotificationRepository,
  type ProcedureRepository,
  type Repositories,
  type ReportRepository,
  type RewardRepository,
  type ServiceCatalogRepository,
  type VerificationRepository,
  type WellbeingRepository,
} from "@/services/contracts";

/**
 * Esqueleto de integraciones reales. Hoy NO existe una API, base de datos ni autenticación municipal
 * común (ver docs/INTEGRACIONES.md): cada método rechaza con IntegracionNoDisponibleError para que la
 * interfaz muestre un error explícito y nunca un éxito ficticio. Para integrar un sistema, reemplaza
 * el método correspondiente por una llamada a un backend autorizado (las credenciales viven en el servidor).
 */
function noDisponible(contrato: string): () => Promise<never> {
  return () => Promise.reject(new IntegracionNoDisponibleError(contrato));
}

const catalog: ServiceCatalogRepository = {
  listCategories: noDisponible("ServiceCatalogRepository.listCategories"),
  list: noDisponible("ServiceCatalogRepository.list"),
  get: noDisponible("ServiceCatalogRepository.get"),
  search: noDisponible("ServiceCatalogRepository.search"),
  coverage: noDisponible("ServiceCatalogRepository.coverage"),
};

const procedures: ProcedureRepository = {
  list: noDisponible("ProcedureRepository.list"),
  get: noDisponible("ProcedureRepository.get"),
  findByFolio: noDisponible("ProcedureRepository.findByFolio"),
  saveDraft: noDisponible("ProcedureRepository.saveDraft"),
  submit: noDisponible("ProcedureRepository.submit"),
  cancel: noDisponible("ProcedureRepository.cancel"),
  simulatePayment: noDisponible("ProcedureRepository.simulatePayment"),
  requestAppointment: noDisponible("ProcedureRepository.requestAppointment"),
};

const reports: ReportRepository = {
  list: noDisponible("ReportRepository.list"),
  get: noDisponible("ReportRepository.get"),
  findByFolio: noDisponible("ReportRepository.findByFolio"),
  findPossibleDuplicates: noDisponible("ReportRepository.findPossibleDuplicates"),
  create: noDisponible("ReportRepository.create"),
  addContribution: noDisponible("ReportRepository.addContribution"),
  followUp: noDisponible("ReportRepository.followUp"),
  validate: noDisponible("ReportRepository.validate"),
  registerAttention: noDisponible("ReportRepository.registerAttention"),
  cancel: noDisponible("ReportRepository.cancel"),
};

const verifications: VerificationRepository = {
  listVerifiable: noDisponible("VerificationRepository.listVerifiable"),
  listMine: noDisponible("VerificationRepository.listMine"),
  listByReport: noDisponible("VerificationRepository.listByReport"),
  submit: noDisponible("VerificationRepository.submit"),
  listForReview: noDisponible("VerificationRepository.listForReview"),
  approve: noDisponible("VerificationRepository.approve"),
  reject: noDisponible("VerificationRepository.reject"),
  revert: noDisponible("VerificationRepository.revert"),
};

const rewards: RewardRepository = {
  getRules: noDisponible("RewardRepository.getRules"),
  getBalance: noDisponible("RewardRepository.getBalance"),
  listMovements: noDisponible("RewardRepository.listMovements"),
  listBenefits: noDisponible("RewardRepository.listBenefits"),
  listRedemptions: noDisponible("RewardRepository.listRedemptions"),
  redeem: noDisponible("RewardRepository.redeem"),
};

const digitalFile: DigitalFileRepository = {
  getProfile: noDisponible("DigitalFileRepository.getProfile"),
  listDocuments: noDisponible("DigitalFileRepository.listDocuments"),
  getDocument: noDisponible("DigitalFileRepository.getDocument"),
  listReusableFields: noDisponible("DigitalFileRepository.listReusableFields"),
  getPrivacy: noDisponible("DigitalFileRepository.getPrivacy"),
  updatePrivacy: noDisponible("DigitalFileRepository.updatePrivacy"),
};

const wellbeing: WellbeingRepository = {
  listPrograms: noDisponible("WellbeingRepository.listPrograms"),
  listHelpLines: noDisponible("WellbeingRepository.listHelpLines"),
  listServiceLocations: noDisponible("WellbeingRepository.listServiceLocations"),
  requestSupportDemo: noDisponible("WellbeingRepository.requestSupportDemo"),
  getAggregatedDemand: noDisponible("WellbeingRepository.getAggregatedDemand"),
};

const notifications: NotificationRepository = {
  list: noDisponible("NotificationRepository.list"),
  markRead: noDisponible("NotificationRepository.markRead"),
  markAllRead: noDisponible("NotificationRepository.markAllRead"),
};

export function crearRepositoriosHttp(): Repositories {
  return { catalog, procedures, reports, verifications, rewards, digitalFile, wellbeing, notifications };
}
