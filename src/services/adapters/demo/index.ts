import { IntegracionNoDisponibleError, type IncidentRepository, type Repositories } from "@/services/contracts";
import { crearCatalogoDemo } from "./catalog";
import { crearExpedienteDemo } from "./digital-file";
import { crearNotificacionesDemo } from "./notifications";
import { crearGestionesDemo } from "./procedures";
import { crearReportesDemo } from "./reports";
import { crearRecompensasDemo } from "./rewards";
import { crearContextoDemo, type ContextoDemo } from "./storage";
import { crearVerificacionesDemo } from "./verifications";
import { crearBienestarDemo } from "./wellbeing";

function noDisponible(contrato: string): () => Promise<never> {
  return () => Promise.reject(new IntegracionNoDisponibleError(contrato));
}

const incidents: IncidentRepository = {
  listAreas: noDisponible("IncidentRepository.listAreas"),
  list: noDisponible("IncidentRepository.list"),
  get: noDisponible("IncidentRepository.get"),
  findByFolio: noDisponible("IncidentRepository.findByFolio"),
  summary: noDisponible("IncidentRepository.summary"),
  register: noDisponible("IncidentRepository.register"),
  reviewClassification: noDisponible("IncidentRepository.reviewClassification"),
  confirmAssignment: noDisponible("IncidentRepository.confirmAssignment"),
  discardProposal: noDisponible("IncidentRepository.discardProposal"),
  returnToCoordination: noDisponible("IncidentRepository.returnToCoordination"),
  registerAttention: noDisponible("IncidentRepository.registerAttention"),
  cancel: noDisponible("IncidentRepository.cancel"),
  addInternalNote: noDisponible("IncidentRepository.addInternalNote"),
};

/** Repositorios simulados en el navegador (datos ficticios en localStorage, prefijo merida-demo:v1:). */
export function crearRepositoriosDemo(contexto: ContextoDemo = crearContextoDemo()): Repositories {
  return {
    catalog: crearCatalogoDemo(contexto),
    procedures: crearGestionesDemo(contexto),
    reports: crearReportesDemo(contexto),
    verifications: crearVerificacionesDemo(contexto),
    rewards: crearRecompensasDemo(contexto),
    digitalFile: crearExpedienteDemo(contexto),
    wellbeing: crearBienestarDemo(contexto),
    notifications: crearNotificacionesDemo(contexto),
    incidents,
  };
}

export { crearContextoDemo } from "./storage";
