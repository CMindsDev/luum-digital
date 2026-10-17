import type { CategoriaReporte } from "./reportes";

/**
 * Contrato para que el asistente PREPARE pantallas sin acoplarse a sus componentes.
 * Se pasa en `navigate(ruta, { state: { prefill } })`. La pantalla destino muestra el aviso
 * «Preparado por el asistente: revisa y confirma» y nunca envía por su cuenta.
 */
export type PrefillAsistente =
  | {
      tipo: "reporte";
      categoria: CategoriaReporte;
      descripcion?: string;
      referenciaUbicacion?: string;
      origen: "asistente";
    }
  | {
      tipo: "tramite";
      servicioId: string;
      origen: "asistente";
    }
  | {
      tipo: "mapa";
      categoria?: CategoriaReporte;
      vista?: "puntos" | "calor" | "celdas" | "lista";
      reporteId?: string;
      origen: "asistente";
    };

export interface EstadoNavegacionAsistente {
  prefill?: PrefillAsistente;
  /** Ancla a la que la pantalla debe desplazarse y enfocar (p. ej. "requisitos"). */
  enfocar?: string;
}
