import type { Repositories } from "@/services/contracts";
import { crearCatalogoDemo } from "./catalog";
import { crearExpedienteDemo } from "./digital-file";
import { crearNotificacionesDemo } from "./notifications";
import { crearGestionesDemo } from "./procedures";
import { crearReportesDemo } from "./reports";
import { crearRecompensasDemo } from "./rewards";
import { crearContextoDemo, type ContextoDemo } from "./storage";
import { crearVerificacionesDemo } from "./verifications";
import { crearBienestarDemo } from "./wellbeing";

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
  };
}

export { crearContextoDemo } from "./storage";
