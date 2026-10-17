import { construirDemandaAgregada } from "@/domain/demanda";
import { referenciaApoyoSimulada } from "@/domain/folios";
import { LINEAS_AYUDA, PROGRAMAS_BIENESTAR, UBICACIONES_SERVICIO } from "@/data/bienestar";
import {
  LEYENDA_DEMANDA_BIENESTAR,
  RESOLUCION_DEMANDA_BIENESTAR,
  UMBRAL_DEMANDA_BIENESTAR,
  ZONAS_DEMANDA_FICTICIA,
} from "@/data/demanda-bienestar";
import type { WellbeingRepository } from "@/services/contracts";
import { exigirAdministracionOOperador } from "./comun";
import { operacionDemo, type ContextoDemo } from "./storage";

/**
 * Bienestar NO persiste nada: no hay colección, ni notificaciones, ni historial. Las solicitudes de
 * apoyo son simuladas y nunca afirman que una persona profesional las recibió.
 */
export function crearBienestarDemo(contexto: ContextoDemo): WellbeingRepository {
  return {
    listPrograms: (area) =>
      operacionDemo(contexto, "wellbeing", "lectura", () => PROGRAMAS_BIENESTAR.filter((p) => !area || p.area === area)),

    listHelpLines: () => operacionDemo(contexto, "wellbeing", "lectura", () => [...LINEAS_AYUDA]),

    listServiceLocations: () => operacionDemo(contexto, "wellbeing", "lectura", () => [...UBICACIONES_SERVICIO]),

    requestSupportDemo: (tipo) =>
      operacionDemo(contexto, "wellbeing", "mutacion", () => ({
        id: contexto.nuevoId("apo"),
        referencia: referenciaApoyoSimulada(),
        tipo,
        fecha: contexto.almacen.ahora().toISOString(),
        leyenda: "Solicitud simulada: nadie la ha recibido" as const,
      })),

    getAggregatedDemand: (actor) =>
      operacionDemo(contexto, "wellbeing", "lectura", () => {
        exigirAdministracionOOperador(actor, "La demanda agregada sólo está disponible para el operador o la administración de demostración.");
        return construirDemandaAgregada(ZONAS_DEMANDA_FICTICIA, {
          resolucion: RESOLUCION_DEMANDA_BIENESTAR,
          umbralMinimo: UMBRAL_DEMANDA_BIENESTAR,
          leyenda: LEYENDA_DEMANDA_BIENESTAR,
        });
      }),
  };
}
