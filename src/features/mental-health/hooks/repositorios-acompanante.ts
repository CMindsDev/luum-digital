import { t } from "i18next";
import type { RepositoriosEjecutor } from "@/features/assistant/runtime";
import type { LineaAyuda } from "@/types";

function noDisponible(): Promise<never> {
  return Promise.reject(new Error(t("Esta consulta no está disponible en el acompañante de bienestar.")));
}

/**
 * Repositorios que ve el ejecutor del acompañante de bienestar. El ámbito «bienestar» sólo puede
 * mostrar ayuda humana y señalar controles, así que sólo se expone la lista de líneas de ayuda (ya
 * cargada en pantalla con useHelpLines). Catálogo, gestiones, reportes y recompensas quedan fuera:
 * la conversación de bienestar no toca datos de la cuenta.
 */
export function crearRepositoriosAcompanante(obtenerLineas: () => readonly LineaAyuda[]): RepositoriosEjecutor {
  return {
    catalog: { get: noDisponible, search: noDisponible },
    procedures: { list: noDisponible, findByFolio: noDisponible },
    reports: { list: noDisponible, findByFolio: noDisponible },
    rewards: { getRules: noDisponible, getBalance: noDisponible, listBenefits: noDisponible },
    wellbeing: { listHelpLines: () => Promise.resolve([...obtenerLineas()]) },
  };
}
